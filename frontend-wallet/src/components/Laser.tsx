import React from 'react';
import { Laser as LaserType } from '../types/gameTypes';

interface LaserProps {
  laser: LaserType;
}

export default function Laser({ laser }: LaserProps) {
  return (
    <div
      className="absolute w-2 h-10"
      style={{
        left: laser.x - 1,
        top: laser.y - 5,
        transform: 'translateZ(0)', // Performance optimization
      }}
    >
      {/* Core beam */}
      <div className="w-full h-full bg-gradient-to-b from-blue-300 to-blue-500 rounded-full" />
      
      {/* Glow effect */}
      <div className="absolute inset-0 bg-blue-400 rounded-full blur-[4px] animate-pulse opacity-75" />
      
      {/* Bright center */}
      <div className="absolute inset-[25%] bg-white rounded-full blur-[2px] animate-pulse" />
    </div>
  );
}