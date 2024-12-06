import { Asteroid, Position, Laser } from '../types/gameTypes';

export function getAsteroidSpawnChance(score: number): number {
  const baseChance = 0.02;
  const maxChance = 0.08;
  const increaseRate = 0.0001;
  return Math.min(baseChance + (score * increaseRate), maxChance);
}

export function generateAsteroid(gameWidth: number): Asteroid {
  return {
    id: `asteroid-${Date.now()}-${Math.random()}`,
    x: Math.random() * (gameWidth - 40) + 20,
    y: -30,
    rotation: Math.random() * 360,
    speed: Math.random() * 3 + 2,
    destroyed: false
  };
}

export function updateAsteroids(asteroids: Asteroid[], gameHeight: number): Asteroid[] {
  return asteroids
    .map(asteroid => ({
      ...asteroid,
      y: asteroid.y + asteroid.speed,
      rotation: asteroid.rotation + asteroid.speed,
    }))
    .filter(asteroid => asteroid.y < gameHeight + 60);
}

export function updateLasers(lasers: Laser[]): Laser[] {
  return lasers
    .map(laser => ({
      ...laser,
      y: laser.y - laser.speed,
    }))
    .filter(laser => laser.y > -20);
}

export function detectCollision(
  spaceship: Position,
  asteroids: Asteroid[]
): boolean {
  const spaceshipRadius = 15;
  const asteroidRadius = 12;

  return asteroids.some(asteroid => {
    const dx = spaceship.x - asteroid.x;
    const dy = spaceship.y - asteroid.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < spaceshipRadius + asteroidRadius;
  });
}

export function detectLaserHits(lasers: Laser[], asteroids: Asteroid[]): {
  hitLasers: string[];
  hitAsteroids: Asteroid[];
} {
  const hitLasers: string[] = [];
  const hitAsteroids: Asteroid[] = [];
  const laserRadius = 8;
  const asteroidRadius = 20;

  lasers.forEach(laser => {
    asteroids.forEach(asteroid => {
      const dx = laser.x - asteroid.x;
      const dy = laser.y - asteroid.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < laserRadius + asteroidRadius) {
        if (!hitLasers.includes(laser.id)) {
          hitLasers.push(laser.id);
        }
        if (!hitAsteroids.find(a => a.id === asteroid.id)) {
          hitAsteroids.push(asteroid);
        }
      }
    });
  });

  return { hitLasers, hitAsteroids };
}