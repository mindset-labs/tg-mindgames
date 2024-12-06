import React from 'react';
import { Asteroid as AsteroidType } from '../types/gameTypes';

interface AsteroidProps {
  asteroid: AsteroidType;
}

export default function Asteroid({ asteroid }: AsteroidProps) {
  return (
    <div
      className="absolute w-8 h-8"
      style={{
        left: asteroid.x - 16,
        top: asteroid.y - 16,
        transform: `rotate(${asteroid.rotation}deg)`,
      }}
    >
      <div className="w-full h-full relative animate-pulse">
        {/* Irregular shape using multiple overlapping circles */}
        <div className="absolute inset-0 bg-gray-700 rounded-full transform translate-x-1" />
        <div className="absolute inset-0 bg-gray-600 rounded-full transform -translate-x-1 translate-y-1" />
        <div className="absolute inset-0 bg-gray-800 rounded-full transform scale-75 translate-x-2" />
        
        {/* Surface details */}
        <div className="absolute inset-2 bg-gray-500 rounded-full opacity-40 transform translate-x-1 translate-y-1" />
        <div className="absolute inset-3 bg-gray-900 rounded-full opacity-30" />
        
        {/* Crater effects */}
        <div className="absolute w-2 h-2 bg-gray-900 rounded-full top-1 left-1 opacity-40" />
        <div className="absolute w-1.5 h-1.5 bg-gray-900 rounded-full bottom-2 right-2 opacity-30" />
        
        {/* Highlight effect */}
        <div className="absolute w-2 h-2 bg-gray-400 rounded-full top-1 right-1 opacity-20" />
      </div>
    </div>
  );
}