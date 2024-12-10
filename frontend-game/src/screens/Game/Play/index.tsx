import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import Navigation from "../../../components/Navigation";
import { useQuery } from "@tanstack/react-query";
import {
  useAbstraxionAccount,
  useAbstraxionSigningClient,
} from "@burnt-labs/abstraxion";
import { CwCooperationDilemmaClient } from "../../../../codegen/CwCooperationDilemma.client";
import { CONTRACTS, TREASURY } from "../../../constants/contracts";
import { sha256 } from "@cosmjs/crypto";
import VersusAnimation from "../../../components/VersusAnimation";
import { CooperateIcon } from "../../../components/icons/CooperateIcon";
import { DefectIcon } from "../../../components/icons/DefectIcon";

const Play = () => {
  const navigate = useNavigate();
  const { gameId } = useParams<{ gameId: string }>();
  const { data: account } = useAbstraxionAccount();
  const { client } = useAbstraxionSigningClient();
  const [isSubmittingChoice, setIsSubmittingChoice] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [committedValue, setCommittedValue] = useState<string>("");
  const [nonce, setNonce] = useState<string>("");
  const [showVersusAnimation, setShowVersusAnimation] = useState(false);

  // Create the contract client only if we have a client
  const contractQueryClient = client
    ? new CwCooperationDilemmaClient(
        client,
        account?.bech32Address ?? "", // Provide empty string as fallback
        CONTRACTS.cwCooperationDilemma
      )
    : null;

  const {
    data: gameDetails,
    isLoading: isLoadingDetails,
    error: gameError,
  } = useQuery({
    queryKey: ["gameDetails", gameId],
    queryFn: async () => {
      if (!contractQueryClient || !gameId) throw new Error("Client not ready");
      console.log("Fetching game details for ID:", gameId);
      const details = await contractQueryClient.getGame({
        gameId: Number(gameId),
      });
      console.log("Game details received:", details);
      return details;
    },
    enabled: !!contractQueryClient && !!gameId,
    refetchInterval: 5000,
    retry: 2,
  });

  const {
    data: currentRound,
    isLoading: isLoadingRound,
    error: roundError,
  } = useQuery({
    queryKey: ["currentRound", gameId],
    queryFn: async () => {
      if (!contractQueryClient || !gameId) throw new Error("Client not ready");
      console.log("Fetching current round for ID:", gameId);
      const round = await contractQueryClient.getCurrentRound({
        gameId: Number(gameId),
      });
      console.log("Current round received:", round);
      return round;
    },
    enabled: !!contractQueryClient && !!gameId,
    refetchInterval: 5000,
    retry: 2,
  });

  const {
    data: gameStatus,
    isLoading: isLoadingStatus,
    error: statusError,
  } = useQuery({
    queryKey: ["gameStatus", gameId],
    queryFn: async () => {
      if (!contractQueryClient || !gameId) throw new Error("Client not ready");
      console.log("Fetching game status for ID:", gameId);
      const status = await contractQueryClient.getGameStatus({
        gameId: Number(gameId),
      });
      console.log("Game status received:", status);
      return status;
    },
    enabled: !!contractQueryClient && !!gameId,
    refetchInterval: 5000,
    retry: 2,
  });

  // Debug logging
  console.log("Debug state:", {
    client: !!client,
    account: !!account,
    contractQueryClient: !!contractQueryClient,
    gameId,
    isLoadingDetails,
    isLoadingRound,
    isLoadingStatus,
    gameDetails,
    currentRound,
    gameStatus,
    errors: {
      game: gameError,
      round: roundError,
      status: statusError,
    },
  });

  const generateNonce = () => {
    return Math.floor(Math.random() * 1000000);
  };

  const handleChoice = async (choice: "cooperate" | "defect") => {
    if (!client || !account?.bech32Address) return;

    try {
      setIsSubmittingChoice(true);

      // Generate and save nonce
      const newNonce = generateNonce();
      setNonce(newNonce.toString());

      // Save original choice for reveal later
      setCommittedValue(choice);
      console.log("Committed value:", choice);

      // Create the hash using the same method
      const encoder = new TextEncoder();
      const choiceBytes = encoder.encode(choice);
      const nonceBytes = new Uint8Array(
        new BigUint64Array([BigInt(newNonce)]).buffer
      ).reverse();

      const hashValue = await crypto.subtle.digest(
        "SHA-256",
        new Uint8Array([...choiceBytes, ...nonceBytes])
      );
      const hashedValue = Array.from(new Uint8Array(hashValue))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      await client.execute(
        account.bech32Address,
        CONTRACTS.cwCooperationDilemma,
        {
          lifecycle: {
            commit_round: {
              game_id: Number(gameId),
              value: hashedValue,
            },
          },
        },
        {
          amount: [{ amount: "1", denom: "uxion" }],
          gas: "500000",
          granter: TREASURY.treasury,
        },
        "",
        []
      );
    } catch (error) {
      console.error("Error submitting choice:", error);
    } finally {
      setIsSubmittingChoice(false);
    }
  };

  const startGame = async () => {
    if (!client || !account?.bech32Address) return;

    try {
      setIsStartingGame(true);
      await client.execute(
        account?.bech32Address,
        CONTRACTS.cwCooperationDilemma,
        {
          lifecycle: {
            start_game: {
              game_id: Number(gameId),
            },
          },
        },
        {
          amount: [{ amount: "1", denom: "uxion" }],
          gas: "500000",
          granter: TREASURY.treasury,
        },
        "",
        []
      );
      setShowVersusAnimation(true);
    } catch (error) {
      console.error("Error starting game:", error);
    } finally {
      setIsStartingGame(false);
    }
  };

  const handleReveal = async () => {
    if (!client || !account?.bech32Address) return;

    try {
      setIsRevealing(true);

      await client.execute(
        account.bech32Address,
        CONTRACTS.cwCooperationDilemma,
        {
          lifecycle: {
            reveal_round: {
              game_id: Number(gameId),
              value: committedValue,
              nonce: parseInt(nonce),
            },
          },
        },
        {
          amount: [{ amount: "1", denom: "uxion" }],
          gas: "500000",
          granter: TREASURY.treasury,
        },
        "",
        []
      );
    } catch (error) {
      console.error("Error revealing round:", error);
      console.log({ committedValue, nonce });
    } finally {
      setIsRevealing(false);
    }
  };

  // Show loading state while client is initializing
  if (!client || !contractQueryClient) {
    return (
      <div className="flex flex-col h-screen w-full bg-gradient-to-br from-[#160f28] via-[#1a1339] to-black animate-gradient">
        <div className="flex justify-center items-center flex-1">
          <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Connecting to wallet...
          </div>
        </div>
        <Navigation />
      </div>
    );
  }

  // Show loading state while data is being fetched
  if (isLoadingDetails || isLoadingRound || isLoadingStatus) {
    return (
      <div className="flex flex-col h-screen w-full bg-gradient-to-br from-[#160f28] via-[#1a1339] to-black animate-gradient">
        <div className="flex justify-center items-center flex-1">
          <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Loading game data...
          </div>
        </div>
        <Navigation />
      </div>
    );
  }

  // Show error state if any query failed
  if (gameError || roundError || statusError) {
    return (
      <div className="flex flex-col h-screen w-full bg-gradient-to-br from-[#160f28] via-[#1a1339] to-black animate-gradient">
        <div className="flex justify-center items-center flex-1 text-red-500">
          Error loading game data. Please try again.
        </div>
        <Navigation />
      </div>
    );
  }

  if (showVersusAnimation && gameDetails?.players) {
    const [player1Address, player1Telegram] = gameDetails.players[0] || [];
    const [player2Address, player2Telegram] = gameDetails.players[1] || [];

    return (
      <VersusAnimation
        player1={player1Telegram || player1Address.slice(0, 8)}
        player2={player2Telegram || player2Address.slice(0, 8)}
        onComplete={() => setShowVersusAnimation(false)}
      />
    );
  }

  // Rest of the component remains the same...
  return (
    <div className="flex flex-col h-screen w-full bg-gradient-to-br from-[#160f28] via-[#1a1339] to-black animate-gradient">
      <main className="flex-1 container mx-auto px-4 py-8 pb-24 mt-3 overflow-y-auto">
        <button
          onClick={() => navigate("/tg-app/game/rooms")}
          className="text-blue-400 hover:text-blue-300 mb-8 hover:underline transition-colors flex items-center gap-2"
        >
          <span>←</span> Back to Rooms
        </button>

        <div className="bg-[#1f1635]/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-purple-500/10 hover:border-purple-500/20 transition-all mb-6">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-4">
            Game #{gameId}
          </h1>
          <div className="space-y-4">
            <div className="bg-[#160f28]/50 rounded-lg p-4">
              <p className="text-gray-300">
                Status:{" "}
                <span className="text-white font-medium">{gameStatus}</span>
              </p>
            </div>
            <div className="bg-[#160f28]/50 rounded-lg p-4">
              <p className="text-gray-300">
                Round:{" "}
                <span className="text-white font-medium">
                  {currentRound} of {gameDetails.config.max_rounds}
                </span>
              </p>
            </div>
            <div className="bg-[#160f28]/50 rounded-lg p-4">
              <p className="text-gray-300">
                Players:{" "}
                <span className="text-white font-medium">
                  {gameDetails.players.length} /{" "}
                  {gameDetails.config.min_players}
                </span>
              </p>
              {gameDetails.players.map(([address, telegramId], index) => (
                <div
                  key={index}
                  className="mt-2 pl-3 border-l-2 border-purple-500/30"
                >
                  <p className="text-sm text-gray-300">
                    Address:{" "}
                    <span className="text-white">
                      {address.slice(0, 8)}...{address.slice(-8)}
                    </span>
                  </p>
                  {telegramId && (
                    <p className="text-sm text-gray-300">
                      Telegram:{" "}
                      <span className="text-white">@{telegramId}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Round information display */}
          {gameDetails.rounds && gameDetails.rounds.length > 0 && (
            <div className="mt-6 border-t border-purple-500/10 pt-6">
              <h3 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-4">
                Round Details
              </h3>
              {gameDetails.rounds.map((round, index) => (
                <div
                  key={index}
                  className="bg-[#160f28]/50 rounded-lg p-4 mb-4"
                >
                  <div className="space-y-2">
                    <p className="text-gray-300">
                      Round ID:{" "}
                      <span className="text-white font-medium">{round.id}</span>
                    </p>
                    <p className="text-gray-300">
                      Status:{" "}
                      <span className="text-white font-medium">
                        {round.status}
                      </span>
                    </p>
                  </div>

                  {/* Choice buttons */}
                  {(gameStatus === "in_progress" || gameStatus === "ready") &&
                    !round.commits.some(
                      ([address]) => address === account?.bech32Address
                    ) && (
                      <div className="mt-4 flex justify-center gap-6">
                        <button
                          onClick={() => handleChoice("cooperate")}
                          disabled={isSubmittingChoice}
                          className={`flex flex-col items-center p-4 rounded-xl transition-all
                                    ${
                                      isSubmittingChoice
                                        ? "opacity-50 cursor-not-allowed"
                                        : "hover:scale-105 hover:shadow-blue-500/20 hover:border-blue-400/30"
                                    }
                                    bg-gradient-to-r from-blue-500/10 to-blue-600/10
                                    border border-blue-400/20 shadow-lg w-32`}
                        >
                          <div className="text-blue-400 mb-2">
                            <CooperateIcon />
                          </div>
                          <span className="text-sm font-medium text-blue-400">
                            {isSubmittingChoice ? "Submitting..." : "Cooperate"}
                          </span>
                        </button>

                        <button
                          onClick={() => handleChoice("defect")}
                          disabled={isSubmittingChoice}
                          className={`flex flex-col items-center p-4 rounded-xl transition-all
                                    ${
                                      isSubmittingChoice
                                        ? "opacity-50 cursor-not-allowed"
                                        : "hover:scale-105 hover:shadow-red-500/20 hover:border-red-400/30"
                                    }
                                    bg-gradient-to-r from-red-500/10 to-red-600/10
                                    border border-red-400/20 shadow-lg w-32`}
                        >
                          <div className="text-red-400 mb-2">
                            <DefectIcon />
                          </div>
                          <span className="text-sm font-medium text-red-400">
                            {isSubmittingChoice ? "Submitting..." : "Defect"}
                          </span>
                        </button>
                      </div>
                    )}

                  {/* Commits and reveals */}
                  {round.commits.length > 0 && (
                    <div className="mt-4 bg-[#1a1339]/50 rounded-lg p-3">
                      <p className="text-blue-400 font-medium mb-2">Commits:</p>
                      {round.commits.map(([address], i) => (
                        <div
                          key={i}
                          className="pl-3 border-l-2 border-purple-500/30 mb-2 last:mb-0"
                        >
                          <p className="text-sm text-gray-300 break-all">
                            Player:{" "}
                            <span className="text-white">
                              {address.slice(0, 8)}...{address.slice(-8)}
                            </span>
                          </p>
                          <p className="text-sm text-gray-300 flex items-center gap-2">
                            Choice:{" "}
                            <div className="flex items-center gap-2 bg-[#160f28]/80 px-3 py-1 rounded-lg border border-purple-500/20">
                              <span className="text-sm text-gray-400">
                                Hidden until revealed
                              </span>
                            </div>
                          </p>
                        </div>
                      ))}
                      {round.commits.length === 1 && (
                        <div className="mt-4 bg-[#160f28]/50 p-3 rounded-lg">
                          <p className="text-sm text-gray-300 text-center">
                            Waiting for other player to make their choice...
                          </p>
                        </div>
                      )}

                      {/* Reveal button */}
                      {round.commits.length === 2 &&
                        !round.reveals.some(
                          ([address]) => address === account?.bech32Address
                        ) && (
                          <button
                            onClick={handleReveal}
                            disabled={isRevealing}
                            className="mt-3 w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 
                                     text-white font-bold py-2 px-4 rounded-lg transition-all shadow-lg hover:shadow-purple-500/20 
                                     border border-purple-400/30 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isRevealing ? "Revealing..." : "Reveal Round"}
                          </button>
                        )}
                    </div>
                  )}

                  {/* Reveals section */}
                  {round.reveals.length > 0 && (
                    <div className="mt-4 bg-[#1a1339]/50 rounded-lg p-3">
                      <p className="text-blue-400 font-medium mb-2">Reveals:</p>
                      {round.reveals.map(([address, choice], i) => (
                        <div
                          key={i}
                          className="pl-3 border-l-2 border-purple-500/30 mb-2 last:mb-0"
                        >
                          <p className="text-sm text-gray-300 break-all">
                            Player:{" "}
                            <span className="text-white">
                              {address.slice(0, 8)}...{address.slice(-8)}
                            </span>
                          </p>
                          <p className="text-sm text-gray-300 flex items-center gap-2">
                            Choice:
                            <span
                              className={
                                choice === "cooperate"
                                  ? "text-blue-400"
                                  : "text-red-400"
                              }
                            >
                              {choice === "cooperate" ? (
                                <CooperateIcon />
                              ) : (
                                <DefectIcon />
                              )}
                            </span>
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Game controls section */}
        {gameStatus === "rounds_finished" ? (
          <div
            className="bg-[#1f1635]/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg 
                        border border-purple-500/10 hover:border-purple-500/20 transition-all"
          >
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-6 text-center">
              Game Finished!
            </h2>
            <div className="space-y-4">
              <div className="bg-[#160f28]/50 rounded-lg p-4">
                <p className="text-gray-300 text-center">
                  Total Rounds Played:{" "}
                  <span className="text-white font-medium">{currentRound}</span>
                </p>
              </div>
              <button
                onClick={() => navigate("/tg-app/game/rooms")}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 
                         text-white font-bold py-3 px-4 rounded-lg transition-all
                         shadow-lg hover:shadow-purple-500/20 border border-purple-400/30"
              >
                Back to Rooms
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#1f1635]/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-purple-500/10 hover:border-purple-500/20 transition-all">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-6">
              {currentRound === 1
                ? "Start Game"
                : currentRound <= gameDetails.config.max_rounds &&
                  gameStatus === "in_progress"
                ? `Round ${currentRound}: Make Your Choice`
                : "Game not started"}
            </h2>

            <div className="flex justify-center gap-4">
              {gameStatus === "pending" ||
                (gameStatus === "ready" && (
                  <button
                    onClick={startGame}
                    disabled={isStartingGame}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 
                           text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-green-500/20 
                           border border-green-400/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isStartingGame ? "Starting..." : "Start Game"}
                  </button>
                ))}
            </div>
          </div>
        )}
      </main>
      <Navigation />
    </div>
  );
};

export default Play;
