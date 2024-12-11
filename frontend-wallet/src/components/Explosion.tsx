import React, { useEffect, useRef } from 'react';
import { Position } from '../types/gameTypes';

interface ExplosionProps {
  position: Position;
  onComplete: () => void;
}

export default function Explosion({ position, onComplete }: ExplosionProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 150); // Duration matches CSS animation

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className="absolute w-16 h-16 pointer-events-none animate-[explode_150ms_ease-out_forwards]"
      style={{
        left: position.x - 32,
        top: position.y - 32,
      }}
    >
      <div className="explosion-core absolute inset-0 bg-orange-400 rounded-full blur-[4px] animate-[explode-core_150ms_ease-out_forwards]" />
      <div className="explosion-center absolute inset-[25%] bg-yellow-100 rounded-full blur-[2px] animate-[explode-center_150ms_ease-out_forwards]" />
      
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 left-1/2 top-1/2"
          style={{
            transform: `rotate(${i * 60}deg)`,
            animation: `particle-${i} 150ms ease-out forwards`,
          }}
        >
          <div className="w-full h-full bg-orange-300 rounded-full" />
        </div>
      ))}
    </div>
  );
}