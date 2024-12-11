import {
  useAbstraxionAccount,
  useAbstraxionSigningClient,
} from "@burnt-labs/abstraxion";
import { CwCooperationDilemmaClient } from "../../codegen/CwCooperationDilemma.client";
import { useQuery } from "@tanstack/react-query";
import { RocketIcon } from "lucide-react";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { CONTRACTS, TREASURY } from "../constants/contracts";
import { useParams } from "react-router-dom";
import { useState } from "react";
import {
  setGameId,
  setNonce,
  setCommittedValue,
} from "../features/asteroidSlice";
import { useAppDispatch, useAppSelector } from "../app/hook";

const GAME_MODES = [
  {
    id: "classic",
    name: "Space Shooter",
    description: "Survive as long as possible",
    icon: RocketIcon,
    color: "blue",
  },
];

interface GameSetupOptions {
  stake: number;
  isPrivate: boolean;
  mode: string;
}

interface GameOnboardingProps {
  onStart: () => void;
  options: GameSetupOptions;
  onOptionsChange: (options: GameSetupOptions) => void;
  gameId?: number;
}

export default function GameOnboarding({
  onStart,
  options,
  onOptionsChange,
  gameId: propGameId,
}: GameOnboardingProps) {
  const { gameId: urlGameId } = useParams();
  const gameId = propGameId || Number(urlGameId);

  const dispatch = useAppDispatch();

  const { data: account } = useAbstraxionAccount();
  const { client } = useAbstraxionSigningClient();

  const [isStartingGame, setIsStartingGame] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isGameInProgress, setIsGameInProgress] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [committedValue, setCommittedValue] = useState<string>("");

  const nonce = useAppSelector((state) => state.asteroid.nonce);
  const score = useAppSelector((state) => state.asteroid.score);

  // Query client for Prisoner's Dilemma
  const asteroidQueryClient = new CwCooperationDilemmaClient(
    client as SigningCosmWasmClient,
    account?.bech32Address,
    CONTRACTS.cwAsteroid
  );

  // Query game status and details
  const { data: gameStatus } = useQuery({
    queryKey: ["asteroidGameStatus", gameId],
    queryFn: async () => {
      if (!gameId) return null;
      const status = await asteroidQueryClient.getGameStatus({
        gameId: gameId,
      });

      console.log("Game Status:", status);
      return status;
    },
    enabled: !!client && !!gameId,
    refetchInterval: 5000,
  });

  const { data: gameDetails } = useQuery({
    queryKey: ["asteroidGameDetails", gameId],
    queryFn: async () => {
      if (!gameId) return null;
      const details = await asteroidQueryClient.getGame({
        gameId: gameId,
      });
      return details;
    },
    enabled: !!client && !!gameId,
    refetchInterval: 5000,
  });

  console.log("Game Details:", gameDetails?.players.length);

  console.log("=== Game Contract Data ===");
  console.log("Game Status:", JSON.stringify(gameStatus, null, 2));
  console.log("Game Details:", JSON.stringify(gameDetails, null, 2));
  console.log("=====================");

  const startGame = async () => {
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

  const handleReveal = async () => {
    console.log("Revealing round:", { score, nonce });
    try {
      setIsRevealing(true);
      if (!client || !account?.bech32Address) return;

      const revealTx = await client.execute(
        account.bech32Address,
        CONTRACTS.cwAsteroid,
        {
          lifecycle: {
            reveal_round: {
              game_id: Number(gameId),
              value: score,
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
      console.log(revealTx);
    } catch (error) {
      console.error("Error revealing round:", error);
      console.log({ committedValue, nonce });
    } finally {
      setIsRevealing(false);
    }
  };

  const endGame = async () => {
    console.log("Ending game:", { gameId });
    try {
      const tx = await client?.execute(
        account?.bech32Address,
        CONTRACTS.cwAsteroid,
        {
          lifecycle: {
            end_game: { game_id: gameId },
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
    } catch (error) {
      console.error("Error ending game:", error);
    }
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-full max-h-full overflow-y-auto py-4 px-4 flex flex-col items-center">
        <div className="max-w-sm w-full flex flex-col items-center relative z-10">
          <h2 className="text-2xl font-bold text-white mb-4">Play to Earn</h2>

          {/* Game Mode Selection */}
          <div className="w-full mb-6">
            <div className="grid gap-2">
              {GAME_MODES.map((mode) => {
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.id}
                    onClick={() =>
                      onOptionsChange({ ...options, mode: mode.id })
                    }
                    className={`flex items-center p-3 rounded-lg border-2 transition-all
                      ${
                        mode.id === options.mode
                          ? `border-${mode.color}-400 bg-${mode.color}-400/20`
                          : "border-white/20 hover:border-white/40"
                      }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg bg-${mode.color}-500/20 flex items-center justify-center mr-3`}
                    >
                      <Icon className={`w-5 h-5 text-${mode.color}-400`} />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-white">
                        {mode.name}
                      </div>
                      <div className="text-sm text-white/70">
                        {mode.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons - Updated with result checking */}
          <div className="flex flex-col w-full gap-2">
            {gameStatus === "ready" ? (
              <button
                onClick={startGame}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 
                         hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg 
                         font-semibold transition-all active:scale-[0.98]"
              >
                Start Game
              </button>
            ) : null}
            {gameStatus === "in_progress" || gameStatus === "created" ? (
              <>
                {gameDetails?.players?.length === 1 ? (
                  <div className="text-center text-white/70">
                    Waiting for another player to join...
                  </div>
                ) : gameDetails?.rounds?.[0]?.commits?.length === 2 ? (
                  <button
                    onClick={handleReveal}
                    disabled={isRevealing}
                    className="mt-3 w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 
                               text-white font-bold py-2 px-4 rounded-lg transition-all shadow-lg hover:shadow-purple-500/20 
                               border border-purple-400/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRevealing ? "Revealing..." : "Reveal Round"}
                  </button>
                ) : gameDetails?.rounds?.[0]?.commits?.some(
                    ([address]) => address === account?.bech32Address
                  ) ? (
                  <div className="text-center text-white/70">
                    Waiting for other player to play...
                  </div>
                ) : (
                  <button
                    onClick={onStart}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 
                               hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg 
                               font-semibold transition-all active:scale-[0.98]"
                  >
                    Play!
                  </button>
                )}
              </>
            ) : gameStatus === "rounds_finished" ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="text-center text-white font-bold text-xl">
                  Game Completed!
                </div>
                <div className="w-full space-y-2">
                  {console.log("Players:", gameDetails?.players)}
                  {console.log("Round 0:", gameDetails?.rounds[0])}
                  {console.log("Reveals:", gameDetails?.rounds[0]?.reveals)}
                  {gameDetails?.players?.map((player, index) => {
                    const playerScore = gameDetails?.rounds[0]?.reveals?.find(
                      ([address]) => address === player[0]
                    )?.[1];
                    console.log("Player:", player, "Score:", playerScore);
                    return (
                      <div
                        key={player[0]}
                        className="flex justify-between items-center bg-white/10 p-3 rounded-lg"
                      >
                        <span className="text-white/90">
                          Player {index + 1}
                          {player[0] === account?.bech32Address ? " (You)" : ""}
                          :
                        </span>
                        <span className="text-white font-bold">
                          {typeof playerScore !== "undefined"
                            ? playerScore
                            : "Not revealed"}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={endGame}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 
                           hover:from-red-500 hover:to-red-600 text-white rounded-lg 
                           font-semibold transition-all active:scale-[0.98]"
                >
                  End Game
                </button>
              </div>
            ) : null}
            {gameStatus === "pending" && (
              <div className="text-center text-white/70">
                Waiting for result verification...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
