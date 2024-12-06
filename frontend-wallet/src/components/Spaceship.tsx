import React, { useEffect, useState } from "react";
import { Position } from "../types/gameTypes";

interface SpaceshipProps {
  position: Position;
  isDragging: boolean;
}

export default function Spaceship({ position, isDragging }: SpaceshipProps) {
  const [prevPosition, setPrevPosition] = useState(position);
  const [tilt, setTilt] = useState(0);

  useEffect(() => {
    // Calculate tilt based on horizontal movement
    const deltaX = position.x - prevPosition.x;
    const targetTilt = Math.min(Math.max(deltaX * -0.5, -15), 15); // Limit tilt to -15° to 15°
    setTilt(targetTilt);
    setPrevPosition(position);
  }, [position, prevPosition]);

  return (
    <div
      className={`absolute w-16 h-16 cursor-grab ${
        isDragging ? "cursor-grabbing" : ""
      }`}
      style={{
        left: position.x - 32,
        top: position.y - 32,
        filter: "drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))",
        transform: `rotate(${tilt}deg)`,
        transition: "transform 0.1s ease-out",
      }}
    >
      {/* Speed lines / wind effect */}
      <div className="absolute inset-0 -z-10">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-12 bg-gradient-to-b from-blue-400/0 via-blue-400/30 to-blue-400/0"
            style={{
              left: `${20 + i * 12}%`,
              top: "100%",
              transform: `rotate(${-5 + i * 2}deg)`,
              animation: `windLine ${0.8 + i * 0.2}s infinite`,
              opacity: 0.5,
            }}
          />
        ))}
      </div>

      <div className="w-full h-full relative">
        {/* Main body */}
        <div className="absolute inset-[15%] bg-gradient-to-b from-gray-200 to-gray-300 transform rotate-45 rounded-sm">
          {/* Body highlights */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent" />
        </div>

        {/* Side wings with animation */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex justify-between">
          <div
            className="w-4 h-8 bg-gradient-to-r from-gray-400 to-gray-300 transform -skew-y-12 origin-top"
            style={{
              transform: `skewY(-12deg) scaleY(${
                1 + Math.max(0, tilt) * 0.02
              })`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/30 to-transparent" />
          </div>
          <div
            className="w-4 h-8 bg-gradient-to-l from-gray-400 to-gray-300 transform skew-y-12 origin-top"
            style={{
              transform: `skewY(12deg) scaleY(${
                1 + Math.max(0, -tilt) * 0.02
              })`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/30 to-transparent" />
          </div>
        </div>

        {/* Enhanced engine glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-6">
          <div className="absolute inset-0 bg-blue-500 rounded-full blur-[4px] animate-pulse opacity-75" />
          <div className="absolute inset-[25%] bg-white rounded-full blur-[2px]" />
          {/* Engine particles */}
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-blue-400 rounded-full"
              style={{
                left: "50%",
                top: "100%",
                transform: "translateX(-50%)",
                animation: `engineParticle ${0.6 + i * 0.2}s infinite`,
                opacity: 0.6,
              }}
            />
          ))}
        </div>

        {/* Enhanced cockpit */}
        <div className="absolute top-[25%] left-1/2 -translate-x-1/2 w-4 h-4">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full" />
          <div className="absolute inset-[25%] bg-blue-300 rounded-full opacity-50">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/80 to-transparent" />
          </div>
        </div>

        {/* Detail lines */}
        <div className="absolute top-1/2 left-1/2 w-6 h-[1px] -translate-x-1/2 -translate-y-1/2 bg-gray-400" />
        <div className="absolute top-[40%] left-1/2 w-4 h-[1px] -translate-x-1/2 bg-gray-400" />

        {/* Enhanced shield effect */}
        {/* <div className="absolute inset-0 bg-gradient-to-t from-transparent to-blue-400/10 rounded-full scale-110 animate-pulse opacity-50">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-300/20 to-transparent animate-spin-slow" />
        </div> */}
      </div>
    </div>
  );
}
