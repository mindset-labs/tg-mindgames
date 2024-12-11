import React from 'react';

interface ScoreDisplayProps {
  score: number;
  distance: number;
}

export default function ScoreDisplay({ distance }: ScoreDisplayProps) {
  return (
    <div className="fixed top-0 left-0 right-0 p-4 pointer-events-none">
      <div className="max-w-md mx-auto flex justify-end items-center">
        <div className="text-2xl font-bold font-mono text-emerald-300">
          <div className="bg-indigo-950/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-emerald-500/30 shadow-lg shadow-emerald-500/20">
            {distance.toString().padStart(6, '0')}
          </div>
        </div>
      </div>
    </div>
  );
}