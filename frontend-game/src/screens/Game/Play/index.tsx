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
      <div className="flex flex-col h-screen w-full bg-gradient-to-b from-[#160f28] to-black">
        <div className="flex justify-center items-center flex-1">
          Connecting to wallet...
        </div>
        <Navigation />
      </div>
    );
  }

  // Show loading state while data is being fetched
  if (isLoadingDetails || isLoadingRound || isLoadingStatus) {
    return (
      <div className="flex flex-col h-screen w-full bg-gradient-to-b from-[#160f28] to-black">
        <div className="flex justify-center items-center flex-1">
          Loading game data...
        </div>
        <Navigation />
      </div>
    );
  }

  // Show error state if any query failed
  if (gameError || roundError || statusError) {
    return (
      <div className="flex flex-col h-screen w-full bg-gradient-to-b from-[#160f28] to-black">
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
    <div className="flex flex-col h-screen w-full bg-gradient-to-b from-[#160f28] to-black">
      <main className="flex-1 container mx-auto px-4 py-8 mt-16 overflow-y-auto h-[calc(100vh-64px)] max-w-7xl">
        <button
          onClick={() => navigate("/tg-app/game/rooms")}
          className="text-white mb-8 hover:text-purple-400 transition-colors"
        >
          ← Back to Rooms
        </button>

        <div className="bg-[#1f1635] rounded-lg p-6 shadow-lg mb-6">
          <h1 className="text-2xl font-bold text-white mb-4">Game #{gameId}</h1>
          <div className="space-y-2 text-gray-300">
            <p>Status: {gameStatus}</p>
            <p>
              Round: {currentRound} of {gameDetails.config.max_rounds}
            </p>
            <p>
              Players: {gameDetails.players.length} /{" "}
              {gameDetails.config.min_players}
            </p>
            {gameDetails.players.map(([address, telegramId], index) => (
              <div
                key={index}
                className="text-sm pl-2 border-l-2 border-gray-600"
              >
                <p className="break-all">
                  Address: {address.slice(0, 8)}...{address.slice(-8)}
                </p>
                {telegramId && <p>Telegram: @{telegramId}</p>}
              </div>
            ))}
          </div>

          {/* Add round information display */}
          {gameDetails.rounds && gameDetails.rounds.length > 0 && (
            <div className="mt-4 border-t border-gray-700 pt-4">
              <h3 className="text-lg font-semibold text-white mb-2">
                Round Details
              </h3>
              {gameDetails.rounds.map((round, index) => (
                <div key={index} className="bg-[#2a1f45] p-4 rounded-lg mb-2">
                  <p className="text-gray-300">Round ID: {round.id}</p>
                  <p className="text-gray-300">Status: {round.status}</p>

                  {/* Show choice buttons if game is in progress/ready and player hasn't committed */}
                  {(gameStatus === "in_progress" || gameStatus === "ready") &&
                    !round.commits.some(
                      ([address]) => address === account?.bech32Address
                    ) && (
                      <div className="mt-4 flex justify-center gap-4">
                        <button
                          className="px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleChoice("cooperate")}
                          disabled={isSubmittingChoice}
                        >
                          {isSubmittingChoice ? "Submitting..." : "Cooperate"}
                        </button>
                        <button
                          className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleChoice("defect")}
                          disabled={isSubmittingChoice}
                        >
                          {isSubmittingChoice ? "Submitting..." : "Defect"}
                        </button>
                      </div>
                    )}

                  {round.commits.length > 0 && (
                    <div className="mt-2">
                      <p className="text-gray-400">Commits:</p>
                      {round.commits.map(([address, choice, data], i) => (
                        <div key={i} className="pl-4 text-sm text-gray-400">
                          <p>
                            Player: {address.slice(0, 8)}...{address.slice(-8)}
                          </p>
                          <p>Choice: {choice}</p>
                        </div>
                      ))}
                      {/* Show reveal button if both players committed but current player hasn't revealed */}
                      {round.commits.length === 2 &&
                        !round.reveals.some(
                          ([address]) => address === account?.bech32Address
                        ) && (
                          <button
                            className="mt-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleReveal}
                            disabled={isRevealing}
                          >
                            {isRevealing ? "Revealing..." : "Reveal Round"}
                          </button>
                        )}
                    </div>
                  )}

                  {round.reveals.length > 0 && (
                    <div className="mt-2">
                      <p className="text-gray-400">Reveals:</p>
                      <div className="pl-4 text-sm text-gray-400">
                        {round.reveals.map((reveal, i) => (
                          <p key={i}>{JSON.stringify(reveal)}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#1f1635] rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-semibold text-white mb-6">
            {currentRound === 1
              ? "Start Game"
              : currentRound <= gameDetails.config.max_rounds &&
                gameStatus === "in_progress"
              ? `Round ${currentRound}: Make Your Choice`
              : "Game Complete"}
          </h2>
          <div className="flex justify-center gap-4">
            {gameStatus === "pending" || gameStatus === "ready" ? (
              <button
                className="px-6 py-3 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={startGame}
                disabled={isStartingGame}
              >
                {isStartingGame ? "Starting..." : "Start Game"}
              </button>
            ) : currentRound <= gameDetails.config.max_rounds &&
              gameStatus === "in_progress" ? (
              <div className="space-y-4 w-full">
                {/* Show commit buttons if player hasn't committed yet */}
                {!gameDetails.rounds[currentRound - 1]?.commits.some(
                  ([address]) => address === account?.bech32Address
                ) && (
                  <div className="flex justify-center gap-4">
                    <button
                      className="px-6 py-3 text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleChoice("cooperate")}
                      disabled={isSubmittingChoice}
                    >
                      {isSubmittingChoice ? "Submitting..." : "Cooperate"}
                    </button>
                    <button
                      className="px-6 py-3 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleChoice("defect")}
                      disabled={isSubmittingChoice}
                    >
                      {isSubmittingChoice ? "Submitting..." : "Defect"}
                    </button>
                  </div>
                )}

                {/* Show reveal buttons if player has committed */}
                {gameDetails.rounds[currentRound - 1]?.commits.some(
                  ([address]) => address === account?.bech32Address
                ) && (
                  <div className="flex justify-center gap-4">
                    <button
                      className="px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleReveal}
                      disabled={isRevealing}
                    >
                      {isRevealing ? "Revealing..." : "Reveal Round"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-white">Waiting for other player...</p>
            )}
          </div>
        </div>

        {/* Add controls for next round when current round has ended */}
        {gameStatus === "in_progress" &&
          currentRound > 0 &&
          currentRound <= gameDetails.config.max_rounds &&
          gameDetails.rounds[currentRound - 1]?.status === "ended" && (
            <div className="bg-[#1f1635] rounded-lg p-6 shadow-lg mt-6">
              <h2 className="text-2xl font-semibold text-white mb-6">
                Round {currentRound}: Make Your Choice
              </h2>
              <div className="flex justify-center gap-4">
                <button
                  className="px-6 py-3 text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleChoice("cooperate")}
                  disabled={isSubmittingChoice}
                >
                  {isSubmittingChoice ? "Submitting..." : "Cooperate"}
                </button>
                <button
                  className="px-6 py-3 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleChoice("defect")}
                  disabled={isSubmittingChoice}
                >
                  {isSubmittingChoice ? "Submitting..." : "Defect"}
                </button>
              </div>
            </div>
          )}
      </main>
      <Navigation />
    </div>
  );
};

export default Play;
