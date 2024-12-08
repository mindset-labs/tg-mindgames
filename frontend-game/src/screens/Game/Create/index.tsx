import { useEffect, useState } from "react";
import Navigation from "../../../components/Navigation";
import dilemma from "../../../assets/dilemma.jpg";
import spaceship from "../../../assets/spaceship.jpeg";
import {
  useAbstraxionAccount,
  useAbstraxionSigningClient,
} from "@burnt-labs/abstraxion";
import { CwCooperationDilemmaClient } from "../../../../codegen/CwCooperationDilemma.client";
import { CONTRACTS, TREASURY } from "../../../constants/contracts";
import { LifecycleClient } from "../../../../codegen/Lifecycle.client";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { ExecuteMsg, GameConfig } from "../../../../codegen/Lifecycle.types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import WebApp from "@twa-dev/sdk";

// You'll need to define this type based on your game data structure
type Game = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  minPlayers?: number;
  maxPlayers?: number;
};

// Add this type definition
type Player = {
  telegramId: string;
  address: string;
};

export const CreateGame = () => {
  const { data: account } = useAbstraxionAccount();
  const { client } = useAbstraxionSigningClient();
  const queryClient = useQueryClient();

  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isGameCreated, setIsGameCreated] = useState(false);
  const [isGameInProgress, setIsGameInProgress] = useState(false);
  const [gameId, setGameId] = useState<number | null>(null);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [currentRound, setCurrentRound] = useState<number | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [arrayOfCommitments, setArrayOfCommitments] = useState<string[]>([]);
  const [selectedGameName, setSelectedGameName] = useState<string | null>(null);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [isJoiningGame, setIsJoiningGame] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);

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

  const availableGames: Game[] = [
    {
      id: "1",
      title: "Prisoner Dilemma",
      description:
        "The prisoner's dilemma is a game theory thought experiment involving two rational agents, each of whom can either cooperate for mutual benefit or betray their partner ('defect') for individual gain.",
      imageUrl: dilemma,
      minPlayers: 2,
      maxPlayers: 2,
    },
    {
      id: "2",
      title: "Space Invaders",
      description:
        "Space Invaders is a classic arcade shooter where you defend Earth from waves of alien invaders. Use your laser cannon to blast the aliens out of the sky and avoid getting hit by their projectiles. As the game progresses, the aliens move faster and become more aggressive, making it increasingly challenging to survive. Can you save humanity from the alien threat?",
      imageUrl: spaceship,
      minPlayers: 2,
      maxPlayers: 2,
    },
    // Add more games here
  ];

  const executeClient = new LifecycleClient(
    client as SigningCosmWasmClient,
    account?.bech32Address,
    "xion17ep30wmgw7xqefagdlx7kz3t746q9rj5xy37tf7g9v68d9d7ncaskl3qrz"
  );

  const contractQueryClient = new CwCooperationDilemmaClient(
    client as SigningCosmWasmClient,
    account?.bech32Address,
    "xion12cfz7k5a6hj744jdsj52r57dth4tlnggcfqdyw6620rja0f6ltdsl8c2rh"
  );

  const { data: roundData } = useQuery({
    queryKey: ["currentRound", gameId],
    queryFn: async () => {
      if (!gameId) return null;
      const round = await contractQueryClient.getCurrentRound({
        gameId: gameId as number,
      });
      return round;
    },
    enabled: !!gameId && !!client,
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  const { data: gameStatus } = useQuery({
    queryKey: ["gameStatus", gameId],
    queryFn: async () => {
      if (!gameId) return null;
      const status = await contractQueryClient.getGameStatus({
        gameId: gameId as number,
      });
      return status;
    },
    enabled: !!gameId && !!client,
    refetchInterval: 5000,
  });

  const { data: gameDetails } = useQuery({
    queryKey: ["gameDetails", gameId],
    queryFn: async () => {
      if (!gameId) return null;
      const details = await contractQueryClient.getGame({
        gameId: gameId as number,
      });
      return details;
    },
    enabled: !!gameId && !!client,
    refetchInterval: 5000,
  });

  // Function to manually refresh all queries
  const refreshGameData = () => {
    queryClient.invalidateQueries({ queryKey: ["currentRound", gameId] });
    queryClient.invalidateQueries({ queryKey: ["gameStatus", gameId] });
    queryClient.invalidateQueries({ queryKey: ["gameDetails", gameId] });
  };

  const createGame = async () => {
    try {
      setIsCreatingGame(true);
      if (!client) {
        console.error("Wallet not connected");
        return;
      }

      const gameConfig: GameConfig = {
        has_turns: true,
        max_rounds: 2,
        min_deposit: "0",
        min_players: 2,
        skip_reveal: false,
      };

      console.log("My address", account?.bech32Address);

      await client
        ?.execute(
          account?.bech32Address,
          CONTRACTS.cwCooperationDilemma,
          {
            lifecycle: {
              create_game: { config: gameConfig },
            },
          },
          {
            amount: [{ amount: "1", denom: "uxion" }],
            gas: "500000",
            granter: TREASURY.treasury,
          },
          "", // memo
          []
        )
        .then((res) => {
          console.log("Transaction response:", res);
          const gameId = res.events
            .find((e) => e.type === "wasm")
            ?.attributes.find((a) => a.key === "game_id")?.value;
          if (gameId) {
            setGameId(parseInt(gameId));
            console.log("Game ID:", gameId);
            setIsGameCreated(true);
          }
        })
        .catch((error) => {
          console.error("Transaction failed:", error);
        })
        .finally(() => {
          setIsCreatingGame(false);
        });
    } catch (error) {
      console.error("Create game failed:", error);
      setIsCreatingGame(false);
    }
  };

  const startGame = async () => {
    try {
      setIsStartingGame(true);
      if (!gameId) {
        throw new Error("Game ID is not set");
      }

      const tx = await client?.execute(
        account?.bech32Address,
        CONTRACTS.cwCooperationDilemma,
        {
          lifecycle: {
            start_game: {
              game_id: gameId,
            },
          },
        },
        {
          amount: [{ amount: "1", denom: "uxion" }],
          gas: "500000",
          granter: TREASURY.treasury,
        },
        "", // memo
        []
      );
      console.log(tx);
      setIsGameStarted(true);
      setIsGameInProgress(true);
    } catch (error) {
      console.error("Failed to start game:", error);
    } finally {
      setIsStartingGame(false);
    }
  };

  const joinGame = async () => {
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
        "", // memo
        []
      );
      console.log(tx);
    } catch (error) {
      console.error("Failed to join game:", error);
    } finally {
      setIsJoiningGame(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-gradient-to-b from-[#160f28] to-black">
      <Navigation />

      <div className="container mx-auto px-4 py-8 overflow-y-auto flex-1">
        <h1 className="text-3xl font-bold text-white mb-8">Available Games</h1>

        {!isGameInProgress ? (
          <div>
            {!selectedGame ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[calc(100vh-12rem)] overflow-y-auto">
                {availableGames.map((game) => (
                  <div
                    key={game.id}
                    className="bg-white/10 rounded-lg p-4 cursor-pointer hover:bg-white/20 transition"
                    onClick={() => setSelectedGame(game)}
                  >
                    <img
                      src={game.imageUrl}
                      alt={game.title}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                    <h2 className="text-xl font-bold text-white">
                      {game.title}
                    </h2>
                  </div>
                ))}
              </div>
            ) : !isGameCreated ? (
              <div className="bg-white/10 rounded-lg p-8 max-w-2xl mx-auto max-h-[calc(100vh-12rem)] overflow-y-auto">
                <button
                  onClick={() => setSelectedGame(null)}
                  className="text-white mb-4 hover:underline"
                >
                  ← Back to games
                </button>

                <img
                  src={selectedGame.imageUrl}
                  alt={selectedGame.title}
                  className="w-full h-64 object-cover rounded-lg mb-6"
                />
                <h2 className="text-3xl font-bold text-white mb-4">
                  {selectedGame.title}
                </h2>
                <p className="text-gray-300 mb-6">{selectedGame.description}</p>
                <div className="text-gray-300 mb-6">
                  Players: {selectedGame.minPlayers} - {selectedGame.maxPlayers}
                </div>

                <button
                  onClick={createGame}
                  disabled={isCreatingGame}
                  className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingGame ? "Creating..." : "Create Game"}
                </button>
              </div>
            ) : (
              <div className="bg-white/10 rounded-lg p-8 max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Game Created!
                </h2>
                <div className="text-gray-300 space-y-4">
                  <p>Game ID: {gameId}</p>
                  <p>Status: {gameStatus?.status || "Pending"}</p>
                  <p>Players: {gameDetails?.players?.length || 0}</p>
                  <p>
                    Current Round: {roundData?.current_round || "Not started"}
                  </p>

                  <div className="flex space-x-4 mt-6">
                    <button
                      onClick={joinGame}
                      disabled={isJoiningGame}
                      className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isJoiningGame ? "Joining..." : "Join Game"}
                    </button>
                    <button
                      onClick={refreshGameData}
                      className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition"
                    >
                      Refresh Data
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white/10 rounded-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-4">
              Game {gameId} in progress
            </h2>
            <div className="text-gray-300 space-y-4">
              <p>Current round: {roundData?.current_round}</p>
              <p>Status: {gameStatus?.status}</p>
              <p>Players: {gameDetails?.players?.length || 0}</p>
              {gameDetails?.players?.map((player: any) => (
                <div key={player.telegramId}>{player.telegramId}</div>
              ))}

              {gameDetails?.players?.length === 2 && !isGameStarted && (
                <button
                  onClick={startGame}
                  disabled={isStartingGame}
                  className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isStartingGame ? "Starting..." : "Start Game"}
                </button>
              )}

              <button
                onClick={() => setIsGameInProgress(false)}
                className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition"
              >
                End Game
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
