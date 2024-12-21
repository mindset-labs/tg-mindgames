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
import { useNavigate } from "react-router-dom";
import Games from "../../../assets/games.png";
import Create from "../../../assets/create-game.png";

// You'll need to define this type based on your game data structure
type Game = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  minPlayers?: number;
  maxPlayers?: number;
  url?: string;
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
  const navigate = useNavigate();

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
      url: "/tg-app/game/play/",
    },
    {
      id: "2",
      title: "Space Invaders",
      description:
        "Space Invaders is a classic arcade shooter where you defend Earth from waves of alien invaders. Use your laser cannon to blast the aliens out of the sky and avoid getting hit by their projectiles. As the game progresses, the aliens move faster and become more aggressive, making it increasingly challenging to survive. Can you save humanity from the alien threat?",
      imageUrl: spaceship,
      minPlayers: 2,
      maxPlayers: 2,
      url: "/tg-app/game/play/asteroid",
    },
    // Add more games here
  ];

  const executeClient = new LifecycleClient(
    client as SigningCosmWasmClient,
    account?.bech32Address,
    CONTRACTS.cwLifeCycle
  );

  const contractQueryClient = new CwCooperationDilemmaClient(
    client as SigningCosmWasmClient,
    account?.bech32Address,
    CONTRACTS.cwCooperationDilemma
  );

  const asteroidQueryClient = new LifecycleClient(
    client as SigningCosmWasmClient,
    account?.bech32Address,
    CONTRACTS.cwAsteroid
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

  const { data: asteroidRoundData } = useQuery({
    queryKey: ["asteroidCurrentRound", gameId],
    queryFn: async () => {
      if (!gameId) return null;
      const round = await asteroidQueryClient.getCurrentRound({
        gameId: gameId as number,
      });
      return round;
    },
    enabled: !!gameId && !!client && selectedGame?.id === "2",
    refetchInterval: 5000,
  });

  const { data: asteroidGameStatus } = useQuery({
    queryKey: ["asteroidGameStatus", gameId],
    queryFn: async () => {
      if (!gameId) return null;
      const status = await asteroidQueryClient.getGameStatus({
        gameId: gameId as number,
      });
      return status;
    },
    enabled: !!gameId && !!client && selectedGame?.id === "2",
    refetchInterval: 5000,
  });

  const { data: asteroidGameDetails } = useQuery({
    queryKey: ["asteroidGameDetails", gameId],
    queryFn: async () => {
      if (!gameId) return null;
      const details = await asteroidQueryClient.getGame({
        gameId: gameId as number,
      });
      return details;
    },
    enabled: !!gameId && !!client && selectedGame?.id === "2",
    refetchInterval: 5000,
  });

  // Function to manually refresh all queries
  const refreshGameData = () => {
    if (selectedGame?.id === "1") {
      queryClient.invalidateQueries({ queryKey: ["currentRound", gameId] });
      queryClient.invalidateQueries({ queryKey: ["gameStatus", gameId] });
      queryClient.invalidateQueries({ queryKey: ["gameDetails", gameId] });
    } else if (selectedGame?.id === "2") {
      queryClient.invalidateQueries({
        queryKey: ["asteroidCurrentRound", gameId],
      });
      queryClient.invalidateQueries({
        queryKey: ["asteroidGameStatus", gameId],
      });
      queryClient.invalidateQueries({
        queryKey: ["asteroidGameDetails", gameId],
      });
    }
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

  const createAsteroidGame = async () => {
    try {
      setIsCreatingGame(true);
      if (!client) {
        console.error("Wallet not connected");
        return;
      }

      const gameConfig: GameConfig = {
        has_turns: true,
        max_rounds: 1,
        min_deposit: "0",
        min_players: 2,
        skip_reveal: false,
      };

      console.log("My address", account?.bech32Address);

      await client
        ?.execute(
          account?.bech32Address,
          CONTRACTS.cwAsteroid,
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
  const joinAsteroidGame = async () => {
    try {
      setIsJoiningGame(true);
      console.log("Joining game");

      const tx = await client?.execute(
        account?.bech32Address,
        CONTRACTS.cwAsteroid,
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
  const startAsteroidGame = async () => {
    try {
      setIsStartingGame(true);
      if (!gameId) {
        throw new Error("Game ID is not set");
      }

      const tx = await client?.execute(
        account?.bech32Address,
        CONTRACTS.cwAsteroid,
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

  const handleCreateGame = async () => {
    if (!selectedGame) return;

    switch (selectedGame.id) {
      case "1": // Prisoner Dilemma
        await createGame();
        break;
      case "2": // Space Invaders
        await createAsteroidGame();
        break;
      default:
        console.error("Unknown game type");
    }
  };

  const handleJoinGame = async () => {
    if (!selectedGame) return;

    switch (selectedGame.id) {
      case "1": // Prisoner Dilemma
        await joinGame();
        break;
      case "2": // Space Invaders
        await joinAsteroidGame();
        break;
      default:
        console.error("Unknown game type");
    }
  };

  const handleStartGame = async () => {
    if (!selectedGame) return;

    switch (selectedGame.id) {
      case "1": // Prisoner Dilemma
        await startGame();
        break;
      case "2": // Space Invaders
        await startAsteroidGame();
        break;
      default:
        console.error("Unknown game type");
    }
  };

  return (
    <>
      <div className="pb-24 flex flex-col h-screen w-full bg-gradient-to-br from-[#160f28] via-[#1a1339] to-black animate-gradient overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col items-center p-8">
            <img
              className="h-23 w-auto rounded-2xl hover:scale-110 transition-all duration-500 
                          animate-float mb-10"
              src={Games}
              alt="Mind Games Logo"
            />

            {!isGameInProgress ? (
              <div>
                {!selectedGame ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                    {availableGames.map((game) => (
                      <div
                        key={game.id}
                        className="bg-[#1f1635]/80 backdrop-blur-sm rounded-2xl p-6 
                             border border-purple-500/10 hover:border-purple-500/20 
                             transition-all shadow-lg hover:shadow-purple-500/20 cursor-pointer"
                        onClick={() => setSelectedGame(game)}
                      >
                        <img
                          src={game.imageUrl}
                          alt={game.title}
                          className="w-full h-48 object-cover rounded-xl mb-4 hover:scale-105 transition-transform duration-300"
                        />
                        <h2 className="text-2xl font-bold text-[#2adaff]">
                          {game.title}
                        </h2>
                      </div>
                    ))}
                  </div>
                ) : !isGameCreated ? (
                  <div
                    className="bg-[#1f1635]/80 backdrop-blur-sm rounded-2xl p-8 max-w-2xl mx-auto 
                            border border-purple-500/10 shadow-lg"
                  >
                    <button
                      onClick={() => setSelectedGame(null)}
                      className="text-[#2adaff] hover:text-400 mb-4 hover:underline transition-colors flex items-center gap-2"
                    >
                      <span>←</span> Back to games
                    </button>

                    <img
                      src={selectedGame.imageUrl}
                      alt={selectedGame.title}
                      className="w-full h-64 object-cover rounded-xl mb-6 hover:scale-105 transition-transform duration-300"
                    />
                    <h2 className="text-3xl font-bold text-[#2adaff] mb-4">
                      {selectedGame.title}
                    </h2>
                    <p className="text-gray-300 mb-6 leading-relaxed">
                      {selectedGame.description}
                    </p>
                    <div className="bg-[#160f28]/50 rounded-lg p-4 mb-6">
                      <p className="text-gray-300">
                        Players:{" "}
                        <span className="text-white font-medium">
                          {selectedGame.minPlayers} - {selectedGame.maxPlayers}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={handleCreateGame}
                      disabled={isCreatingGame}
                      className="w-full bg-gradient-to-r hover:from-[#2adaff] hover:to-[#164af8] from-blue-600 to-[#164af8] transition-all shadow-lg shadow-[#2adaff]/20
                               text-white font-bold py-3 px-4 rounded-2xl transition-all
                           disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreatingGame ? "Creating..." : "Create Game"}
                    </button>
                  </div>
                ) : (
                  <div
                    className="bg-[#1f1635]/80 backdrop-blur-sm rounded-2xl p-8 max-w-2xl mx-auto 
                            border border-purple-500/10 shadow-lg"
                  >
                    <h2 className="text-2xl font-bold text-[#2adaff] mb-6">
                      Game Created!
                    </h2>
                    <div className="space-y-4">
                      <div className="bg-[#160f28]/50 rounded-lg p-4">
                        <p className="text-gray-300">
                          Game ID:{" "}
                          <span className="text-white font-medium">
                            {gameId}
                          </span>
                        </p>
                      </div>
                      <div className="bg-[#160f28]/50 rounded-lg p-4">
                        <p className="text-gray-300">
                          Status:{" "}
                          <span className="text-white font-medium">
                            {gameStatus?.status || "Pending"}
                          </span>
                        </p>
                      </div>
                      <div className="bg-[#160f28]/50 rounded-lg p-4">
                        <p className="text-gray-300">
                          Players:{" "}
                          <span className="text-white font-medium">
                            {gameDetails?.players?.length || 0}
                          </span>
                        </p>
                      </div>
                      <div className="bg-[#160f28]/50 rounded-lg p-4">
                        <p className="text-gray-300">
                          Current Round:{" "}
                          <span className="text-white font-medium">
                            {roundData?.current_round || "Not started"}
                          </span>
                        </p>
                      </div>

                      <div className="flex gap-4 mt-6">
                        <button
                          onClick={handleJoinGame}
                          disabled={isJoiningGame}
                          className="flex-1 bg-gradient-to-r hover:from-[#2adaff] hover:to-[#164af8] from-blue-600 to-[#164af8] transition-all shadow-lg shadow-[#2adaff]/20
                               text-white font-bold py-3 px-4 rounded-2xl transition-all
                           disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isJoiningGame ? "Joining..." : "Join Game"}
                        </button>
                      </div>

                      {(selectedGame?.id === "2"
                        ? asteroidGameDetails?.players
                        : gameDetails?.players
                      )?.some(
                        (player) => player[0] === account?.bech32Address
                      ) && (
                        <button
                          onClick={() =>
                            navigate(
                              selectedGame?.id === "2"
                                ? `/tg-app/game/play/asteroid/${gameId}`
                                : `/tg-app/game/play/${gameId}`
                            )
                          }
                          className="w-full from-pink-500 via-red-500 to-yellow-500 bg-[length:_400%_400%] p-[3px] bg-gradient-to-r 
                                     text-white font-bold py-3 px-4 rounded-2xl transition-all
                                     shadow-lg shadow-[#2adaff]/20"
                        >
                          Play Game
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                className="bg-[#1f1635]/80 backdrop-blur-sm rounded-2xl p-8 max-w-2xl mx-auto 
                         border border-purple-500/10 shadow-lg"
              >
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-6">
                  Game {gameId} in progress
                </h2>
                <div className="space-y-4">
                  <div className="bg-[#160f28]/50 rounded-lg p-4">
                    <p className="text-gray-300">
                      Current round:{" "}
                      <span className="text-white font-medium">
                        {roundData?.current_round}
                      </span>
                    </p>
                  </div>
                  <div className="bg-[#160f28]/50 rounded-lg p-4">
                    <p className="text-gray-300">
                      Status:{" "}
                      <span className="text-white font-medium">
                        {gameStatus?.status}
                      </span>
                    </p>
                  </div>
                  <div className="bg-[#160f28]/50 rounded-lg p-4">
                    <p className="text-gray-300">
                      Players:{" "}
                      <span className="text-white font-medium">
                        {gameDetails?.players?.length || 0}
                      </span>
                    </p>
                    {gameDetails?.players?.map((player: any) => (
                      <div
                        key={player.telegramId}
                        className="text-blue-400 mt-2"
                      >
                        @{player.telegramId}
                      </div>
                    ))}
                  </div>

                  {gameDetails?.players?.length === 2 && !isGameStarted && (
                    <button
                      onClick={handleStartGame}
                      disabled={isStartingGame}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 
                           text-white font-bold py-3 px-4 rounded-2xl transition-all mt-4
                           shadow-lg hover:shadow-green-500/20 border border-green-400/30
                           disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isStartingGame ? "Starting..." : "Start Game"}
                    </button>
                  )}

                  <button
                    onClick={() => setIsGameInProgress(false)}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 
                         text-white font-bold py-3 px-4 rounded-2xl transition-all
                         shadow-lg hover:shadow-red-500/20 border border-red-400/30"
                  >
                    End Game
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Navigation />
    </>
  );
};
