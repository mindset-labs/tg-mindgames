import React, { useEffect, useRef, useState, useCallback } from "react";
import { useGameLoop } from "../../../../hooks/useGameLoop";
import { useGyroscope } from "../../../../hooks/useGyroscope";
import Spaceship from "../../../../components/Spaceship";
import Asteroid from "../../../../components/Asteroid";
import Laser from "../../../../components/Laser";
import Explosion from "../../../../components/Explosion";
import ScoreDisplay from "../../../../components/ScoreDisplay";
import {
  Asteroid as AsteroidType,
  Laser as LaserType,
  Explosion as ExplosionType,
  Position,
} from "../../../../types/gameTypes";
import {
  generateAsteroid,
  updateAsteroids,
  updateLasers,
  detectCollision,
  detectLaserHits,
  getAsteroidSpawnChance,
} from "../../../../utils/gameLogic";
import GameOnboarding from "../../../../components/GameOnboarding";
import GameResult from "../../../../components/GameResult";
import Navigation from "../../../../components/Navigation";
import WebApp from "@twa-dev/sdk";
import {
  useAbstraxionAccount,
  useAbstraxionSigningClient,
} from "@burnt-labs/abstraxion";
import { CONTRACTS, TREASURY } from "../../../../constants/contracts";
import { useParams } from "react-router-dom";
import { setScore, setNonce } from "../../../../features/asteroidSlice";
import { useAppDispatch } from "../../../../app/hook";

interface GameSetupOptions {
  stake: number;
  isPrivate: boolean;
  mode: string;
}

export default function PlayAsteroid() {
  const [distance, setDistance] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [spaceshipPosition, setSpaceshipPosition] = useState<Position>({
    x: 0,
    y: 0,
  });
  const [asteroids, setAsteroids] = useState<AsteroidType[]>([]);
  const [lasers, setLasers] = useState<LaserType[]>([]);
  const [explosions, setExplosions] = useState<ExplosionType[]>([]);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastDistanceUpdateRef = useRef<number>(0);
  const gameLoopRef = useRef<boolean>(true);
  const gyroscope = useGyroscope();

  const [gameOptions, setGameOptions] = useState<GameSetupOptions>({
    stake: 1,
    isPrivate: false,
    mode: "classic",
  });
  const [isSettingUp, setIsSettingUp] = useState(true);
  const { data: account } = useAbstraxionAccount();
  const { client } = useAbstraxionSigningClient();

  const generateNonce = () => {
    return Math.floor(Math.random() * 1000000);
  };

  const { gameId } = useParams<{ gameId: string }>();

  const [isSubmittingChoice, setIsSubmittingChoice] = useState(false);
  // const [nonce, setNonce] = useState<string>("");
  const [committedValue, setCommittedValue] = useState<number>();

  const dispatch = useAppDispatch();

  const [hasPlayedGame, setHasPlayedGame] = useState(false);

  const handleCommitScore = async (score: number) => {
    setHasPlayedGame(true);

    dispatch(setScore(score.toString()));

    if (!client || !account?.bech32Address) return;

    try {
      setIsSubmittingChoice(true);

      // Generate and save nonce
      const newNonce = generateNonce();
      // setNonce(newNonce.toString());

      dispatch(setNonce(newNonce));

      console.log("Nonce:", newNonce);
      console.log("Score:", score);

      // Save original choice for reveal later
      setCommittedValue(score);
      console.log("Committed value:", score);

      // Create the hash using the same method
      const encoder = new TextEncoder();
      const choiceBytes = encoder.encode(score.toString());
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
        CONTRACTS.cwAsteroid,
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

    setHasPlayedGame(true);
  };

  const handleReturnToOnboarding = () => {
    setGameOver(false);
    setGameStarted(false);
    setIsSettingUp(true);
  };

  const handleShare = () => {
    const text = `🚀 I scored ${distance} points in Space Shooter! Can you beat my score?`;
    if (navigator.share) {
      navigator.share({
        title: "Space Shooter Score",
        text: text,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  useEffect(() => {
    WebApp.expand();
    WebApp.disableVerticalSwipes();
    // WebApp.requestFullscreen();
  }, []);

  useEffect(() => {
    const scoreElement = document.getElementById("score");
    if (scoreElement) {
      scoreElement.textContent = distance.toString();
    }
  }, [distance]);

  useEffect(() => {
    if (gameAreaRef.current) {
      const { width, height } = gameAreaRef.current.getBoundingClientRect();
      setSpaceshipPosition({ x: width / 2, y: height - 100 });
    }

    return () => {
      gameLoopRef.current = false;
    };
  }, []);

  // Handle gyroscope movement
  useEffect(() => {
    if (
      !gameStarted ||
      gameOver ||
      isDraggingRef.current ||
      !gyroscope.isSupported ||
      !gameAreaRef.current
    )
      return;

    const { width, height } = gameAreaRef.current.getBoundingClientRect();
    const padding = 32;
    const moveSpeed = 10;

    setSpaceshipPosition((prev) => ({
      x: Math.max(
        padding,
        Math.min(width - padding, prev.x + gyroscope.x * moveSpeed)
      ),
      y: Math.max(
        padding,
        Math.min(height - padding, prev.y + gyroscope.y * moveSpeed)
      ),
    }));
  }, [gyroscope.x, gyroscope.y, gameStarted, gameOver]);

  const handleLaserHit = useCallback((hitAsteroids: AsteroidType[]) => {
    WebApp?.HapticFeedback.impactOccurred("light");

    if (!gameLoopRef.current) return;
    // Try to trigger haptic feedback if available

    setExplosions((prev) => [
      ...prev,
      ...hitAsteroids.map((asteroid) => ({
        id: `explosion-${Date.now()}-${Math.random()}`,
        x: asteroid.x,
        y: asteroid.y,
      })),
    ]);

    setAsteroids((prev) =>
      prev.filter(
        (asteroid) => !hitAsteroids.some((hit) => hit.id === asteroid.id)
      )
    );
  }, []);

  const gameLoop = useCallback(() => {
    if (!gameStarted || !gameLoopRef.current) return;

    const now = Date.now();
    if (now - lastDistanceUpdateRef.current >= 100 && !gameOver) {
      setDistance((prev) => prev + 1);
      lastDistanceUpdateRef.current = now;
    }

    if (!gameOver) {
      setAsteroids((prevAsteroids) => {
        const gameArea = gameAreaRef.current;
        if (!gameArea) return prevAsteroids;

        const { width, height } = gameArea.getBoundingClientRect();
        const spawnChance = getAsteroidSpawnChance(distance);
        const newAsteroids =
          Math.random() < spawnChance ? [generateAsteroid(width)] : [];

        return [...updateAsteroids(prevAsteroids, height), ...newAsteroids];
      });

      setLasers((prevLasers) => {
        const updatedLasers = updateLasers(prevLasers);
        const { hitLasers, hitAsteroids } = detectLaserHits(
          updatedLasers,
          asteroids
        );

        if (hitAsteroids.length > 0) {
          handleLaserHit(hitAsteroids);
          return updatedLasers.filter((laser) => !hitLasers.includes(laser.id));
        }

        return updatedLasers;
      });

      if (detectCollision(spaceshipPosition, asteroids)) {
        // alert("Game results committed!");
        handleCommitScore(distance);
        setGameOver(true);
        setHighScore((prev) => Math.max(prev, distance));
      }
    }
  }, [
    gameStarted,
    gameOver,
    spaceshipPosition,
    asteroids,
    distance,
    handleLaserHit,
  ]);

  useGameLoop(gameLoop);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!gameStarted || gameOver) return;
    e.preventDefault();
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (
      !gameStarted ||
      gameOver ||
      !isDraggingRef.current ||
      !gameAreaRef.current
    )
      return;
    e.preventDefault();

    const rect = gameAreaRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const padding = 32;

    setSpaceshipPosition({
      x: Math.max(padding, Math.min(rect.width - padding, x)),
      y: Math.max(padding, Math.min(rect.height - padding, y)),
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      e.preventDefault();
      isDraggingRef.current = false;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!gameStarted || gameOver || isDraggingRef.current) return;

    setLasers((prev) => [
      ...prev,
      {
        id: `laser-${Date.now()}-${Math.random()}`,
        x: spaceshipPosition.x,
        y: spaceshipPosition.y - 20,
        speed: 10,
      },
    ]);
  };

  const handleExplosionComplete = useCallback((id: string) => {
    if (gameLoopRef.current) {
      setExplosions((prev) => prev.filter((explosion) => explosion.id !== id));
    }
  }, []);

  const resetGame = () => {
    if (!gameAreaRef.current) return;
    const { width, height } = gameAreaRef.current.getBoundingClientRect();

    // Calibrate gyroscope to current position
    if (gyroscope.isSupported) {
      gyroscope.calibrate();
    }

    gameLoopRef.current = true;
    setGameOver(false);
    setDistance(0);
    setAsteroids([]);
    setLasers([]);
    setExplosions([]);
    setSpaceshipPosition({ x: width / 2, y: height - 100 });
    lastDistanceUpdateRef.current = Date.now();
    setGameStarted(true);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-indigo-950 via-blue-900 to-blue-800 text-white">
      <div
        ref={gameAreaRef}
        className="w-full h-full relative overflow-hidden bg-gradient-to-b from-indigo-950 via-blue-900 to-blue-800"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleClick}
        style={{ touchAction: "none" }}
      >
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2220%22 height=%2220%22%3E%3Ccircle cx=%221%22 cy=%221%22 r=%220.5%22 fill=%22rgba(255,255,255,0.3)%22/%3E%3C/svg%3E')] opacity-30 animate-[twinkle_2s_ease-in-out_infinite]" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22%3E%3Ccircle cx=%221%22 cy=%221%22 r=%220.7%22 fill=%22rgba(255,255,255,0.2)%22/%3E%3C/svg%3E')] opacity-20 animate-[twinkle_3s_ease-in-out_infinite]" />
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-indigo-950/50" />
        </div>

        <div className="relative z-10">
          <Spaceship
            position={spaceshipPosition}
            isDragging={isDraggingRef.current}
          />
          {asteroids.map((asteroid) => (
            <Asteroid key={asteroid.id} asteroid={asteroid} />
          ))}
          {lasers.map((laser) => (
            <Laser key={laser.id} laser={laser} />
          ))}
          {explosions.map((explosion) => (
            <Explosion
              key={explosion.id}
              position={explosion}
              onComplete={() => handleExplosionComplete(explosion.id)}
            />
          ))}

          <ScoreDisplay distance={distance} />
        </div>

        {gameOver && (
          <div className="absolute inset-0 backdrop-blur-sm bg-black/40 z-20">
            <GameResult
              distance={distance}
              highScore={highScore}
              stake={gameOptions.stake}
              onPlayAgain={handleReturnToOnboarding}
              onShare={handleShare}
            />
          </div>
        )}

        {!gameStarted && isSettingUp && (
          <div className="absolute inset-0 backdrop-blur-sm bg-black/40 z-20">
            <GameOnboarding
              onStart={resetGame}
              options={gameOptions}
              onOptionsChange={setGameOptions}
              isPlayDisabled={hasPlayedGame}
            />
          </div>
        )}
      </div>
      <Navigation />
    </div>
  );
}
