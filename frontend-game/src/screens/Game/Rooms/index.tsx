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
export enum GameStatus {
  PENDING = "pending",
  CREATED = "created",
  IN_PROGRESS = "in_progress",
  ENDED = "ended",
  READY = "ready",
}

interface Room {
  id: number;
  players: [string, string][];
  status: string;
  currentRound?: number;
  config: {
    max_rounds: number;
    min_players: number;
  };
}

export const Rooms = () => {
  const { data: account } = useAbstraxionAccount();
  const { client } = useAbstraxionSigningClient();

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
        const allGames = await contractQueryClient.getGamesCount();
        console.log("Total games count:", allGames);

        if (typeof allGames !== "number") {
          console.error("Invalid games count received");
          return [];
        }

        const gamesWithDetails = await Promise.all(
          Array.from({ length: allGames }, async (_, index) => {
            try {
              const [game, status, round] = await Promise.all([
                contractQueryClient.getGame({ gameId: index }),
                contractQueryClient.getGameStatus({ gameId: index }),
                contractQueryClient.getCurrentRound({ gameId: index }),
              ]);

              const gameDetails = {
                ...game,
                id: index,
                status: status || "unknown",
                currentRound: round || undefined,
              };

              console.log(`Game #${index} details:`, {
                id: gameDetails.id,
                players: gameDetails.players,
                status: gameDetails.status,
                currentRound: gameDetails.currentRound,
                config: gameDetails.config,
              });

              return gameDetails;
            } catch (gameError) {
              console.error(
                `Failed to fetch details for game ${index}:`,
                gameError
              );
              return {
                id: index,
                players: [],
                status: "error",
                config: {
                  max_rounds: 0,
                  min_players: 0,
                },
              };
            }
          })
        );

        const filteredGames = gamesWithDetails.filter((game) => game !== null);
        console.log("All games after filtering:", filteredGames);
        return filteredGames;
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

  const joinGame = async (gameId: number) => {
    try {
      setIsJoiningGame(true);
      console.log("Joining game");

      const tx = await client?.execute(
        account?.bech32Address,
        CONTRACTS.cwCooperationDilemma,
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
      <div className="flex flex-col min-h-screen w-full bg-gradient-to-b from-[#160f28] to-black">
        <Navigation />
        <div className="flex justify-center items-center flex-grow">
          <div className="text-white text-xl">Loading rooms...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen w-full bg-gradient-to-b from-[#160f28] to-black">
        <Navigation />
        <div className="flex justify-center items-center flex-grow">
          <div className="text-red-500 text-xl">
            Error loading rooms. Please try again later.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-gradient-to-b from-[#160f28] to-black overflow-hidden">
      <Navigation />

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center p-8">
          <h1 className="text-3xl font-bold text-white mb-8">
            Available Rooms
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <h2 className="text-xl font-semibold text-white mb-2">
                  Game #{room.id}
                </h2>
                <div className="text-gray-300">
                  <p className="mb-2">
                    Players: {room.players.length}/{room.config.min_players}
                  </p>
                  {room.players.length > 0 && (
                    <div className="mb-2 space-y-1">
                      <p className="text-sm font-semibold">Player Details:</p>
                      {room.players.map(([address, telegramId], index) => (
                        <div
                          key={index}
                          className="text-sm pl-2 border-l-2 border-gray-600"
                        >
                          {address ? (
                            <p className="break-all">
                              Address: {address.slice(0, 8)}...
                              {address.slice(-8)}
                            </p>
                          ) : (
                            <p className="break-all">Address: Not available</p>
                          )}
                          {telegramId && <p>Telegram: @{telegramId}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                  {room.currentRound && (
                    <p>
                      Round: {room.currentRound}/{room.config.max_rounds}
                    </p>
                  )}
                  <p
                    className={`mt-2 ${
                      room.status === GameStatus.PENDING
                        ? "text-green-400"
                        : room.status === GameStatus.CREATED
                        ? "text-blue-400"
                        : "text-yellow-400"
                    }`}
                  >
                    Status: {room.status}
                  </p>

                  {room.status === GameStatus.CREATED && (
                    <>
                      <button
                        onClick={() => joinGame(room.id)}
                        disabled={isJoiningGame}
                        className={`mt-4 w-full ${
                          isJoiningGame
                            ? "bg-gray-500 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700"
                        } text-white font-bold py-2 px-4 rounded transition-colors`}
                      >
                        {isJoiningGame ? "Joining..." : "Join Game"}
                      </button>
                      {notification && room.id === room.id && (
                        <p
                          className={`mt-2 text-sm ${
                            notification.type === "success"
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {notification.message}
                        </p>
                      )}
                    </>
                  )}

                  {(room.status === "ready" ||
                    room.status === "in_progress") && (
                    <button
                      onClick={() =>
                        (window.location.href = `/tg-app/game/play/${room.id}`)
                      }
                      className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors"
                    >
                      Play Game
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => (window.location.href = "/create")}
            className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
          >
            Create New Room
          </button>
        </div>
      </div>
    </div>
  );
};
