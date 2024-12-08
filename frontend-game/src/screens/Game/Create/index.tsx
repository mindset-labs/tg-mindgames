import { useState } from "react";
import Navigation from "../../../components/Navigation";
import dilemma from "../../../assets/dilemma.jpg";
import spaceship from "../../../assets/spaceship.jpeg";
import { useAbstraxionSigningClient } from "@burnt-labs/abstraxion";
import { CwCooperationDilemmaClient } from "../../../../codegen/CwCooperationDilemma.client";
import { LifecycleClient } from "../../../../codegen/Lifecycle.client";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { ExecuteMsg, GameConfig } from "../../../../codegen/Lifecycle.types";

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
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const { client } = useAbstraxionSigningClient();
  const [isGameCreated, setIsGameCreated] = useState(false);
  const [isGameInProgress, setIsGameInProgress] = useState(false);
  const [gameId, setGameId] = useState<number | null>(null);
  const [currentRound, setCurrentRound] = useState<number | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [arrayOfCommitments, setArrayOfCommitments] = useState<string[]>([]);

  // Mock data - replace with actual API call
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
    "xion1p6z52rfzkehhjm64cdd6396swzhqqj787u205kux06vr4uyp8lxqe5v8gr",
    "xion17ep30wmgw7xqefagdlx7kz3t746q9rj5xy37tf7g9v68d9d7ncaskl3qrz"
  );

  const queryClient = new CwCooperationDilemmaClient(
    client as SigningCosmWasmClient,
    "xion1p6z52rfzkehhjm64cdd6396swzhqqj787u205kux06vr4uyp8lxqe5v8gr",
    "xion12cfz7k5a6hj744jdsj52r57dth4tlnggcfqdyw6620rja0f6ltdsl8c2rh"
  );

  const getCurrentRound = async () => {
    const currentRound = await queryClient.getCurrentRound({ gameId: 1 });
    console.log(currentRound);
  };

  const createGame = async () => {
    const randomGameId = Math.floor(Math.random() * 1000000);
    const gameConfig: GameConfig = {
      has_turns: true,
      max_rounds: 10,
      min_deposit: "0",
      min_players: 2,
      skip_reveal: false,
    };

    const tx = await executeClient
      .createGame({ config: gameConfig })
      .then((res) => {
        console.log(res);
        const gameId = res.events
          .find((e) => e.type === "wasm")
          ?.attributes.find((a) => a.key === "game_id")?.value;
        if (gameId) {
          setGameId(parseInt(gameId));
          console.log("Game ID:", gameId);
        }
      });

    // const createGameMsg: ExecuteMsg = {
    //   create_game: {
    //     config: gameConfig,
    //   },
    // };
  };

  //TODO: move to rooms screen
  // const joinGame = async () => {
  //   const joinGameMsg: ExecuteMsg = {
  //     join_game: {
  //       game_id: randomGameId,
  //     },
  //   };
  // };

  const startGame = async () => {
    const randomGameId = Math.floor(Math.random() * 1000000);

    const startGameMsg: ExecuteMsg = {
      start_game: {
        game_id: randomGameId,
      },
    };

    const tx = await client?.execute(
      "xion1p6z52rfzkehhjm64cdd6396swzhqqj787u205kux06vr4uyp8lxqe5v8gr",
      "xion17ep30wmgw7xqefagdlx7kz3t746q9rj5xy37tf7g9v68d9d7ncaskl3qrz",
      startGameMsg,
      "auto"
    );
    console.log(tx);
    setIsGameCreated(true);
    setGameId(randomGameId);
    getCurrentRound();
    setIsGameInProgress(true);
  };

  // const startGame = async () => {
  //   const randomGameId = Math.floor(Math.random() * 1000000);
  //   const tx = await executeClient
  //     .startGame({ gameId: randomGameId })
  //     .then((res) => {
  //       console.log(res);
  //       setIsGameCreated(true);
  //       setGameId(randomGameId);
  //       getCurrentRound();
  //       setIsGameInProgress(true);
  //     });
  // };

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
            ) : (
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
                  className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition"
                >
                  Create Game
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            Game {gameId} in progress
            <div>Current round: {currentRound}</div>
            <div>
              Players: {players.length}
              {players.map((player) => (
                <div key={player.telegramId}>{player.telegramId}</div>
              ))}
            </div>
            <div>
              <button onClick={() => setIsGameInProgress(false)}>
                End Game
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
