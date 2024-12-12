import Navigation from "../../../components/Navigation";
import { useQuery } from "@tanstack/react-query";
import {
  useAbstraxionAccount,
  useAbstraxionSigningClient,
} from "@burnt-labs/abstraxion";
import { CwCooperationDilemmaClient } from "../../../../codegen/CwCooperationDilemma.client";
import { CONTRACTS, TREASURY } from "../../../constants/contracts";
import WebApp from "@twa-dev/sdk";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import RoomsLogo from "../../../assets/rooms.png";
export enum GameStatus {
  PENDING = "pending",
  CREATED = "created",
  IN_PROGRESS = "in_progress",
  ENDED = "ended",
  ROUNDS_FINISHED = "rounds_finished",
  READY = "ready",
}

interface Room {
  id: number;
  players: never[];
  status: string;
  config: {
    max_rounds: number;
    min_players: number;
  };
  game_name: string;
}

export const Rooms = () => {
  const { data: account } = useAbstraxionAccount();
  const { client } = useAbstraxionSigningClient();

  const navigate = useNavigate();

  const { data: telegramName } = useQuery({
    queryKey: ["telegramName"],
    queryFn: async () => {
      if (!client) {
        throw new Error("Client not initialized");
      }
      const telegramName = await WebApp.initDataUnsafe?.user?.username;
      return telegramName;
    },
    enabled: !!client,
  });

  const contractQueryClient = new CwCooperationDilemmaClient(
    client,
    account?.bech32Address,
    CONTRACTS.cwCooperationDilemma // Your contract address
  );

  const asteroidQueryClient = new CwCooperationDilemmaClient(
    client,
    account?.bech32Address,
    CONTRACTS.cwAsteroid
  );

  const {
    data: rooms = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["games"],
    queryFn: async () => {
      if (!client || !contractQueryClient) return [];

      try {
        // Fetch games count from both contracts
        const [dilemmaGamesCount, asteroidGamesCount] = await Promise.all([
          contractQueryClient.getGamesCount(),
          asteroidQueryClient.getGamesCount(),
        ]);
        console.log(
          "Total games count - Dilemma:",
          dilemmaGamesCount,
          "Asteroid:",
          asteroidGamesCount
        );

        // Fetch details for both types of games
        const dilemmaGames = await Promise.all(
          Array.from({ length: dilemmaGamesCount }, async (_, index) => {
            try {
              const [game, status, round] = await Promise.all([
                contractQueryClient.getGame({ gameId: index }),
                contractQueryClient.getGameStatus({ gameId: index }),
                contractQueryClient.getCurrentRound({ gameId: index }),
              ]);

              return {
                ...game,
                id: index,
                game_name: "Dilemma",
                status: status || "unknown",
                currentRound: round || undefined,
              };
            } catch (gameError) {
              console.error(
                `Failed to fetch dilemma game ${index}:`,
                gameError
              );
              return null;
            }
          })
        );

        const asteroidGames = await Promise.all(
          Array.from({ length: asteroidGamesCount }, async (_, index) => {
            try {
              const [game, status, round] = await Promise.all([
                asteroidQueryClient.getGame({ gameId: index }),
                asteroidQueryClient.getGameStatus({ gameId: index }),
                asteroidQueryClient.getCurrentRound({ gameId: index }),
              ]);

              return {
                ...game,
                id: index,
                game_name: "Asteroid",
                status: status || "unknown",
                currentRound: round || undefined,
              };
            } catch (gameError) {
              console.error(
                `Failed to fetch asteroid game ${index}:`,
                gameError
              );
              return null;
            }
          })
        );

        // Combine and filter out null values
        const allGames = [...dilemmaGames, ...asteroidGames].filter(
          (game) => game !== null
        );
        console.log("All games after filtering:", allGames);
        return allGames;
      } catch (error) {
        console.error("Failed to fetch games:", error);
        throw new Error("Failed to load games. Please try again later.");
      }
    },
    enabled: !!client && !!contractQueryClient,
    refetchInterval: 5000, // Refetch every 5 seconds
    refetchIntervalInBackground: true, // Continue refreshing even when tab is in background
    staleTime: 3000, // Consider data stale after 3 seconds
  });
  const [isJoiningGame, setIsJoiningGame] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const joinGame = async (gameId: number, gameName: string) => {
    try {
      setIsJoiningGame(true);
      console.log(`Joining ${gameName} game`);

      const contractAddress =
        gameName === "Asteroid"
          ? CONTRACTS.cwAsteroid
          : CONTRACTS.cwCooperationDilemma;

      const tx = await client?.execute(
        account?.bech32Address,
        contractAddress,
        {
          lifecycle: {
            join_game: { game_id: gameId, telegram_id: telegramName ?? "" },
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

      await new Promise((resolve) => setTimeout(resolve, 1000));
      await refetch();

      setNotification({
        message: "Successfully joined the game! 🎮",
        type: "success",
      });
    } catch (error) {
      console.error("Failed to join game:", error);
      setNotification({
        message: `Failed to join game: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        type: "error",
      });
    } finally {
      setIsJoiningGame(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen w-full bg-gradient-to-br from-[#160f28] via-[#1a1339] to-black animate-gradient">
        <Navigation />
        <div className="flex justify-center items-center flex-grow">
          <div className="text-[#2adaff] text-2xl font-bold">
            Loading rooms...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen w-full bg-gradient-to-br from-[#160f28] via-[#1a1339] to-black animate-gradient">
        <Navigation />
        <div className="flex justify-center items-center flex-grow">
          <div className="text-red-400 text-2xl font-bold">
            Error loading rooms. Please try again later.
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="pb-24 flex flex-col h-screen w-full bg-gradient-to-br from-[#160f28] via-[#1a1339] to-black animate-gradient overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col items-center p-8">
            <img
              className="h-23 w-auto rounded-2xl transition-all duration-500 
                         hover:scale-110 transition-all duration-500 mb-10"
              src={RoomsLogo}
              alt="Mind Games Logo"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-[#1f1635]/80 backdrop-blur-sm rounded-2xl p-6 
                         border border-purple-500/10 hover:border-[#2adaff]/20 
                         transition-all shadow-lg hover:shadow-blue-500/20"
                >
                  <h2 className="text-2xl font-semibold text-[#2adaff] mb-4">
                    Game #{room.id}
                  </h2>
                  <p className="text-gray-300 text-sm mb-4">{room.game_name}</p>
                  <div className="space-y-3">
                    <div className="bg-[#160f28]/50 rounded-lg p-3">
                      <p className="text-gray-300">
                        Players:{" "}
                        <span className="text-white font-medium">
                          {room.players.length}/{room.config.min_players}
                        </span>
                      </p>
                    </div>

                    {room.players.length > 0 && (
                      <div className="bg-[#160f28]/50 rounded-lg p-3 space-y-2">
                        <p className="text-[#2adaff] font-semibold">
                          Player Details:
                        </p>
                        {room.players.map(([address, telegramId], index) => (
                          <div
                            key={index}
                            className="pl-3 border-l-2 border-pink-500/30 space-y-1"
                          >
                            {address && (
                              <p className="text-gray-300 text-sm">
                                Address:{" "}
                                <span className="text-white">
                                  {address.slice(0, 8)}...{address.slice(-8)}
                                </span>
                              </p>
                            )}
                            {telegramId && (
                              <p className="text-gray-300 text-sm">
                                Telegram:{" "}
                                <span className="text-white">
                                  @{telegramId}
                                </span>
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {room.currentRound && (
                      <div className="bg-[#160f28]/50 rounded-lg p-3">
                        <p className="text-gray-300">
                          Round:{" "}
                          <span className="text-white font-medium">
                            {room.currentRound}/{room.config.max_rounds}
                          </span>
                        </p>
                      </div>
                    )}

                    <div className="bg-[#160f28]/50 rounded-lg p-3">
                      <p
                        className={`font-medium ${
                          room.status === GameStatus.PENDING
                            ? "text-green-400"
                            : room.status === GameStatus.CREATED
                            ? "text-blue-400"
                            : "text-yellow-400"
                        }`}
                      >
                        Status: {room.status}
                      </p>
                    </div>

                    {room.status === GameStatus.CREATED && (
                      <div className="space-y-2 mt-4">
                        <button
                          key={room.id}
                          onClick={() => joinGame(room.id, room.game_name)}
                          disabled={isJoiningGame}
                          className={`w-full ${
                            isJoiningGame
                              ? "bg-gradient-to-r hover:from-[#2adaff] hover:to-[#164af8] from-blue-600 to-[#164af8] transition-all text-white font-bold py-3 px-4 rounded-2xl transition-all opacity-50"
                              : "bg-gradient-to-r hover:from-[#2adaff] hover:to-[#164af8] from-blue-600 to-[#164af8] transition-all text-white font-bold py-3 px-4 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          } text-white font-bold py-3 px-4 transition-all
                        `}
                        >
                          {isJoiningGame ? "Joining..." : "Join Game"}
                        </button>
                        {notification && room.id === room.id && (
                          <p
                            className={`text-sm ${
                              notification.type === "success"
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {notification.message}
                          </p>
                        )}
                      </div>
                    )}

                    {(room.status === "ready" ||
                      room.status === "in_progress") && (
                      <button
                        key={room.id}
                        onClick={() =>
                          navigate(
                            room.game_name === "Asteroid"
                              ? `/tg-app/game/play/asteroid/${room.id}`
                              : `/tg-app/game/play/${room.id}`
                          )
                        }
                        className="w-full from-pink-500 via-red-500 to-yellow-500 bg-[length:_400%_400%] p-[3px] bg-gradient-to-r 
                                     text-white font-bold py-3 px-4 rounded-2xl transition-all
                                     shadow-lg shadow-[#2adaff]/20"
                      >
                        Play Game
                      </button>
                    )}

                    {room.status === "rounds_finished" && (
                      <button
                        onClick={() =>
                          navigate(
                            room.game_name === "Asteroid"
                              ? `/tg-app/game/play/asteroid/${room.id}`
                              : `/tg-app/game/play/${room.id}`
                          )
                        }
                        className="w-full border border-purple-500/10  p-[3px] bg-gradient-to-r 
                                     text-white font-bold py-3 px-4 rounded-2xl transition-all
                                     hover:border-pink-500 hover:shadow-purple-500/20"
                      >
                        View Results
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Navigation />
    </>
  );
};
