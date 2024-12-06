import React, { useEffect, useRef, useState, useCallback } from "react";
import { useGameLoop } from "../hooks/useGameLoop";
import { useGyroscope } from "../hooks/useGyroscope";
import Spaceship from "./Spaceship";
import Asteroid from "./Asteroid";
import Laser from "./Laser";
import Explosion from "./Explosion";
import ScoreDisplay from "./ScoreDisplay";
import {
  Asteroid as AsteroidType,
  Laser as LaserType,
  Explosion as ExplosionType,
  Position,
} from "../types/gameTypes";
import {
  generateAsteroid,
  updateAsteroids,
  updateLasers,
  detectCollision,
  detectLaserHits,
  getAsteroidSpawnChance,
} from "../utils/gameLogic";
import GameOnboarding from "./GameOnboarding";
import GameResult from "./GameResult";
import Navigation from "./Navigation";

interface GameSetupOptions {
  stake: number;
  isPrivate: boolean;
  mode: string;
}

export default function Game() {
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
    const isTelegram = window.Telegram?.WebApp !== undefined;
    const webApp = window?.Telegram?.WebApp;

    if (isTelegram) {
      webApp.expand();
      webApp.disableVerticalSwipes();
      webApp.requestFullscreen();
    }
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
    const isTelegram = window.Telegram?.WebApp !== undefined;

    if (isTelegram) {
      window?.Telegram?.WebApp?.HapticFeedback.impactOccurred("light");
    }

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
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2220%22 height=%2220%22%3E%3Ccircle cx=%221%22 cy=%221%22 r=%221%22 fill=%22rgba(255,255,255,0.1)%22/%3E%3C/svg%3E')] opacity-50" />

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

        {/* {gameOver && (
        <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center">
          <h2 className="text-3xl font-bold text-white mb-4">Game Over</h2>
          <p className="text-xl text-white mb-2">Distance: {distance}</p>
          <p className="text-lg text-white mb-6">Best Distance: {highScore}</p>
          <button
            onClick={resetGame}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 active:bg-blue-700 transition-colors"
          >
            Play Again
          </button>
        </div>
      )} */}

        {gameOver && (
          <GameResult
            distance={distance}
            highScore={highScore}
            stake={gameOptions.stake}
            onPlayAgain={handleReturnToOnboarding}
            onShare={handleShare}
          />
        )}

        {!gameStarted && isSettingUp && (
          <GameOnboarding
            onStart={resetGame}
            options={gameOptions}
            onOptionsChange={setGameOptions}
          />
        )}
      </div>
      <Navigation />
    </div>
  );
}
