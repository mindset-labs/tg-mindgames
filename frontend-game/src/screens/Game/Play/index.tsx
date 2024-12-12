import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
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
import Confetti from "react-confetti";
import useWindowSize from "react-use/lib/useWindowSize";

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
  const [isGameEnded, setIsGameEnded] = useState(false);
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(false);
  const [isEndingGame, setIsEndingGame] = useState(false);

  // Create the contract client only if we have a client
  const contractQueryClient = client
    ? new CwCooperationDilemmaClient(
        client,
        account?.bech32Address ?? "", // Provide empty string as fallback
        CONTRACTS.cwCooperationDilemma
      )
    : null;

  // 1. Memoize game status query
  const gameStatusQuery = useQuery({
    queryKey: ["asteroidGameStatus", gameId],
    queryFn: async () => {
      if (!gameId || !contractQueryClient) return null;
      const status = await contractQueryClient.getGameStatus({
        gameId: Number(gameId),
      });
      return status;
    },
    enabled: !!contractQueryClient && !!gameId,
    refetchInterval: 5000,
  });

  // 2. Memoize game details query
  const gameDetailsQuery = useQuery({
    queryKey: ["asteroidGameDetails", gameId],
    queryFn: async () => {
      if (!gameId || !contractQueryClient) return null;
      const details = await contractQueryClient.getGame({
        gameId: Number(gameId),
      });
      return details;
    },
    enabled: !!contractQueryClient && !!gameId,
    refetchInterval: 5000,
  });

  // 3. Memoize handlers
  const handleChoice = useCallback(
    async (choice: "cooperate" | "defect") => {
      if (!client || !account?.bech32Address) return;
      try {
        setIsSubmittingChoice(true);

        // Generate nonce first
        const newNonce = Math.floor(Math.random() * 1000000);
        setNonce(newNonce.toString()); // Store nonce in state
        console.log("Generated nonce:", newNonce); // Debug log

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
        console.error("Error in handleChoice:", error);
      } finally {
        setIsSubmittingChoice(false);
      }
    },
    [client, account?.bech32Address, gameId]
  );

  const handleReveal = useCallback(async () => {
    if (!client || !account?.bech32Address) return;
    try {
      setIsRevealing(true);
      console.log("Revealing with nonce:", nonce); // Debug log
      console.log("Committed value:", committedValue); // Debug log

      if (!nonce) {
        console.error("Nonce is missing!");
        return;
      }

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
      console.error("Error in handleReveal:", error);
      console.log("Debug state:", { committedValue, nonce });
    } finally {
      setIsRevealing(false);
    }
  }, [client, account?.bech32Address, gameId, nonce, committedValue]);

  // const showConfettiTimeout = useRef<NodeJS.Timeout>();

  // useEffect(() => {
  //   return () => {
  //     if (showConfettiTimeout.current) {
  //       clearTimeout(showConfettiTimeout.current);
  //     }
  //   };
  // }, []);

  const updateGameResults = useCallback(
    (results: GameResult[]) => {
      setGameResults(results);

      // Handle confetti separately
      const playerResult = results.find(
        (r) => r.player === account?.bech32Address
      );
      const opponentResult = results.find(
        (r) => r.player !== account?.bech32Address
      );

      if (playerResult && opponentResult) {
        const playerScore = parseInt(playerResult.score);
        const opponentScore = parseInt(opponentResult.score);

        if (playerScore > opponentScore) {
          setShowConfetti(true);
        }
      }
    },
    [account?.bech32Address]
  );

  // 5. Update handleNewBlock to use memoized updateGameResults
  const handleNewBlock = useCallback(
    (data: any) => {
      if (
        data?.result?.events &&
        data.result.events["wasm-game_winnings.player"]
      ) {
        const players = data.result.events["wasm-game_winnings.player"];
        const scores = data.result.events["wasm-game_winnings.score"];

        const results: GameResult[] = players.map(
          (player: string, index: number) => ({
            player,
            score: scores[index],
          })
        );

        updateGameResults(results);
      }
    },
    [updateGameResults]
  );

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

  const endGame = async () => {
    console.log("Ending game:", { gameId });
    try {
      setIsEndingGame(true);
      const tx = await client?.execute(
        account?.bech32Address,
        CONTRACTS.cwCooperationDilemma,
        {
          lifecycle: {
            end_game: { game_id: Number(gameId) },
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
      console.log(tx);
      setIsGameEnded(true);
    } catch (error) {
      console.error("Error ending game:", error);
    } finally {
      setIsEndingGame(false);
    }
  };

  const wsEndpoint = "wss://rpc.xion-testnet-1.burnt.com/websocket";
  const wsRef = useRef(null);

  interface GameResult {
    player: string;
    score: string;
  }

  const [gameResults, setGameResults] = useState<GameResult[]>([]);

  useEffect(() => {
    const ws = new WebSocket(wsEndpoint);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connection established.");
      // Subscribe to both NewBlock and Tx events
      ws.send(
        JSON.stringify({
          jsonrpc: "2.0",
          method: "subscribe",
          id: "1",
          params: {
            query:
              "tm.event='Tx' AND wasm._contract_address='" +
              CONTRACTS.cwCooperationDilemma +
              "'",
          },
        })
      );
    };

    ws.onmessage = (message) => {
      try {
        const data = JSON.parse(message.data);
        handleNewBlock(data);
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed.");
    };

    // Cleanup function
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

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
  if (gameStatusQuery.isLoading || gameDetailsQuery.isLoading) {
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
  if (
    gameStatusQuery.error ||
    gameDetailsQuery.error ||
    gameResults.length > 0
  ) {
    // If the game is ended, show a completion screen with results
    if (gameResults.length > 0 || gameStatusQuery.data === "ended") {
      return (
        <div className="flex flex-col h-screen w-full bg-gradient-to-br from-[#160f28] via-[#1a1339] to-black animate-gradient">
          {showConfetti && (
            <Confetti
              width={1000}
              height={1000}
              numberOfPieces={300}
              gravity={0.3}
            />
          )}
          <main className="flex-1 container mx-auto px-4 py-8 pb-24 mt-3 overflow-y-auto">
            <button
              onClick={() => navigate("/tg-app/game/rooms")}
              className="text-[#2adaff] hover:text-400 mb-4 hover:underline transition-colors flex items-center gap-2"
            >
              <span>←</span> Back to Rooms
            </button>
            <div className="bg-[#1f1635]/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-purple-500/10">
              <h2 className="text-2xl font-bold text-[#2adaff] mb-6 text-center">
                Game Completed!
              </h2>

              {/* Final Results Section */}
              {gameResults.length > 0 && (
                <div className="w-full space-y-4 mt-4">
                  <div className="text-center text-white font-bold mb-2">
                    Final Results
                  </div>
                  {gameResults.map((result: GameResult, index: number) => {
                    const isCurrentPlayer =
                      result.player === account?.bech32Address;
                    const score = parseInt(result.score);
                    return (
                      <div
                        key={result.player}
                        className={`p-4 rounded-lg ${
                          isCurrentPlayer
                            ? "bg-blue-500/20 border border-blue-500/30"
                            : "bg-white/10"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-white/90">
                            {isCurrentPlayer ? "You" : "Opponent"}
                          </span>
                          <span className="text-white font-bold">
                            {score} points
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Winner announcement */}
                  {gameResults.length === 2 && (
                    <div className="mt-6 text-center relative">
                      {(() => {
                        const playerResult = gameResults.find(
                          (r: GameResult) => r.player === account?.bech32Address
                        );
                        const opponentResult = gameResults.find(
                          (r: GameResult) => r.player !== account?.bech32Address
                        );

                        const playerScore = parseInt(
                          playerResult?.score || "0"
                        );
                        const opponentScore = parseInt(
                          opponentResult?.score || "0"
                        );

                        if (playerScore > opponentScore) {
                          return (
                            <div className="relative">
                              <div className="absolute inset-0 animate-pulse-glow bg-green-500/20 blur-xl rounded-full" />
                              <div className="relative">
                                <div className="text-green-400 font-bold text-xl animate-bounce">
                                  🎉 Congratulations! You Won! 🎉
                                </div>
                                <div className="text-sm text-green-300 mt-2">
                                  Your score: {playerScore} | Opponent score:{" "}
                                  {opponentScore}
                                </div>
                              </div>
                            </div>
                          );
                        } else if (playerScore < opponentScore) {
                          return (
                            <div className="text-amber-400 font-bold text-xl">
                              Better luck next time!
                              <div className="text-sm text-amber-300 mt-2">
                                Your score: {playerScore} | Opponent score:{" "}
                                {opponentScore}
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="text-blue-400 font-bold text-xl">
                              It's a tie!
                              <div className="text-sm text-blue-300 mt-2">
                                Score: {playerScore}
                              </div>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>
          <Navigation />
        </div>
      );
    }
  }

  // Show versus animation: TODO: use websocket to show to both players
  if (showVersusAnimation && gameDetailsQuery.data?.players) {
    const [player1Address, player1Telegram] =
      gameDetailsQuery.data.players[0] || [];
    const [player2Address, player2Telegram] =
      gameDetailsQuery.data.players[1] || [];

    return (
      <VersusAnimation
        player1={player1Telegram || player1Address.slice(0, 8)}
        player2={player2Telegram || player2Address.slice(0, 8)}
        onComplete={() => setShowVersusAnimation(false)}
      />
    );
  }

  if (gameResults.length <= 0) {
    return (
      <div className="flex flex-col h-screen w-full bg-gradient-to-br from-[#160f28] via-[#1a1339] to-black animate-gradient">
        <main className="flex-1 container mx-auto px-4 py-8 pb-24 mt-3 overflow-y-auto">
          <button
            onClick={() => navigate("/tg-app/game/rooms")}
            className="text-[#2adaff] hover:text-400 mb-4 hover:underline transition-colors flex items-center gap-2"
          >
            <span>←</span> Back to Rooms
          </button>

          <div className="bg-[#1f1635]/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-purple-500/10 hover:border-purple-500/20 transition-all mb-6">
            <h1 className="text-2xl font-bold text-[#2adaff] mb-4">
              Game #{gameId}
            </h1>
            <div className="space-y-4">
              <div className="bg-[#160f28]/50 rounded-lg p-4">
                <p className="text-gray-300">
                  Status:{" "}
                  <span className="text-white font-medium">
                    {gameStatusQuery.data}
                  </span>
                </p>
              </div>
              <div className="bg-[#160f28]/50 rounded-lg p-4">
                <p className="text-gray-300">
                  Round:{" "}
                  <span className="text-white font-medium">
                    {gameDetailsQuery.data.currentRound} of{" "}
                    {gameDetailsQuery.data.config.max_rounds}
                  </span>
                </p>
              </div>
              <div className="bg-[#160f28]/50 rounded-lg p-4">
                <p className="text-gray-300">
                  Players:{" "}
                  <span className="text-white font-medium">
                    {gameDetailsQuery.data.players.length} /{" "}
                    {gameDetailsQuery.data.config.min_players}
                  </span>
                </p>
                {gameDetailsQuery.data.players.map(
                  ([address, telegramId], index) => (
                    <div
                      key={index}
                      className="mt-2 pl-3 border-l-2 border-pink-500/30"
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
                  )
                )}
              </div>
            </div>

            {/* Round information display */}
            {gameDetailsQuery.data.rounds &&
              gameDetailsQuery.data.rounds.length > 0 && (
                <div className="mt-6 border-t border-purple-500/10 pt-6">
                  <h3 className="text-xl font-semibold text-[#2adaff] mb-4">
                    Round Details
                  </h3>
                  {gameDetailsQuery.data.rounds.map((round, index) => (
                    <div
                      key={index}
                      className="bg-[#160f28]/50 rounded-lg p-4 mb-4"
                    >
                      <div className="space-y-2">
                        <p className="text-gray-300">
                          Round ID:{" "}
                          <span className="text-white font-medium">
                            {round.id}
                          </span>
                        </p>
                        <p className="text-gray-300">
                          Status:{" "}
                          <span className="text-white font-medium">
                            {round.status}
                          </span>
                        </p>
                      </div>

                      {/* Choice buttons */}
                      {(gameStatusQuery.data === "in_progress" ||
                        gameStatusQuery.data === "ready") &&
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
                                {isSubmittingChoice
                                  ? "Submitting..."
                                  : "Cooperate"}
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
                                {isSubmittingChoice
                                  ? "Submitting..."
                                  : "Defect"}
                              </span>
                            </button>
                          </div>
                        )}

                      {/* Commits and reveals */}
                      {round.commits.length > 0 && (
                        <div className="mt-4 bg-[#1a1339]/50 rounded-lg p-3">
                          <p className="text-blue-400 font-medium mb-2">
                            Commits:
                          </p>
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
                                className="mt-3 w-full bg-gradient-to-r hover:from-[#2adaff] hover:to-[#164af8] from-blue-600 to-[#164af8] transition-all shadow-lg shadow-[#2adaff]/20
                               text-white font-bold py-3 px-4 rounded-2xl transition-all
                           disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isRevealing ? "Revealing..." : "Reveal Round"}
                              </button>
                            )}
                        </div>
                      )}

                      {/* Reveals section */}
                      {round.reveals.length > 0 && (
                        <div className="mt-4 bg-[#1a1339]/50 rounded-lg p-3">
                          <p className="text-blue-400 font-medium mb-2">
                            Reveals:
                          </p>
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
          {gameStatusQuery.data === "rounds_finished" ? (
            <div
              className="bg-[#1f1635]/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg 
                        border border-purple-500/10 hover:border-purple-500/20 transition-all"
            >
              <h2 className="text-2xl font-bold text-[#2adaff] text-center mb-4">
                Game Finished!
              </h2>
              <div className="space-y-4">
                {/* <div className="bg-[#160f28]/50 rounded-lg p-4">
                <p className="text-gray-300 text-center">
                  Total Rounds Played:{" "}
                  <span className="text-white font-medium">
                    {gameDetailsQuery.data.currentRound}
                  </span>
                </p>
              </div> */}

                <button
                  onClick={endGame}
                  disabled={isEndingGame}
                  className="w-full from-pink-500 via-red-500 to-yellow-500 bg-[length:_400%_400%] p-[3px] bg-gradient-to-r 
                                     text-white font-bold py-3 px-4 rounded-2xl transition-all
                                     shadow-lg shadow-[#2adaff]/20
                                     disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isEndingGame ? "Ending game..." : "End Game"}
                </button>
                <button
                  onClick={() => navigate("/tg-app/game/rooms")}
                  className="w-full bg-gradient-to-r hover:from-[#2adaff] hover:to-[#164af8] from-blue-600 to-[#164af8] transition-all shadow-lg shadow-[#2adaff]/20
                               text-white font-bold py-3 px-4 rounded-2xl transition-all
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Back to Rooms
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#1f1635]/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-purple-500/10 hover:border-purple-500/20 transition-all">
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-6">
                {gameDetailsQuery.data.currentRound === 1
                  ? "Start Game"
                  : gameDetailsQuery.data.currentRound <=
                      gameDetailsQuery.data.config.max_rounds &&
                    gameStatusQuery.data === "in_progress"
                  ? `Round ${gameDetailsQuery.data.currentRound}: Make Your Choice`
                  : ""}
              </h2>

              <div className="flex justify-center gap-4">
                {gameStatusQuery.data === "pending" ||
                  (gameStatusQuery.data === "ready" && (
                    <button
                      onClick={startGame}
                      disabled={isStartingGame}
                      className="w-full bg-gradient-to-r hover:from-[#2adaff] hover:to-[#164af8] from-blue-600 to-[#164af8] transition-all shadow-lg shadow-[#2adaff]/20
                               text-white font-bold py-3 px-4 rounded-2xl transition-all
                           disabled:opacity-50 disabled:cursor-not-allowed"
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
  }
};

export default Play;
