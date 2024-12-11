import React from "react";
import {
  TrophyIcon,
  StarIcon,
  ZapIcon,
  TargetIcon,
  ShareIcon,
  RotateCcwIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
interface GameResultProps {
  distance: number;
  highScore: number;
  onPlayAgain: () => void;
  onShare: () => void;
  stake: number;
}

export default function GameResult({
  distance,
  highScore,
  onPlayAgain,
  onShare,
  stake,
}: GameResultProps) {
  const rewards = Math.floor(distance / 100) * stake;
  const isNewHighScore = distance > highScore;

  const navigate = useNavigate();

  return (
    <div className="absolute inset-0  flex flex-col items-center justify-center pb-24">
      <div className="w-full max-w-sm mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Game Over</h2>
          {isNewHighScore && (
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-yellow-400/20 rounded-full">
              <TrophyIcon className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-yellow-400">
                New High Score!
              </span>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-indigo-950/50 backdrop-blur-sm rounded-xl p-4 border border-indigo-800/30">
            <div className="flex items-center space-x-2 mb-1">
              <ZapIcon className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-400">Distance</span>
            </div>
            <div className="text-2xl font-bold text-white">{distance}</div>
          </div>

          <div className="bg-indigo-950/50 backdrop-blur-sm rounded-xl p-4 border border-indigo-800/30">
            <div className="flex items-center space-x-2 mb-1">
              <TargetIcon className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400">Best</span>
            </div>
            <div className="text-2xl font-bold text-white">{highScore}</div>
          </div>
        </div>

        {/* Rewards Section */}
        <div className="bg-indigo-950/50 backdrop-blur-sm rounded-xl p-4 border border-indigo-800/30 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <StarIcon className="w-5 h-5 text-yellow-400" />
              <span className="text-lg font-semibold text-white">Rewards</span>
            </div>
            <span className="text-2xl font-bold text-yellow-400">
              {rewards}
            </span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-indigo-200">
              <span>Base Reward</span>
              <span>{Math.floor(distance / 100)}</span>
            </div>
            <div className="flex justify-between text-indigo-200">
              <span>Stake Multiplier</span>
              <span>x{stake}</span>
            </div>
            {isNewHighScore && (
              <div className="flex justify-between text-yellow-400">
                <span>High Score Bonus</span>
                <span>+{stake}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => navigate("/tg-app/game/rooms")}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg font-semibold transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
          >
            <RotateCcwIcon className="w-5 h-5" />
            <span>Get back to Rooms</span>
          </button>

          {/* <button
            onClick={onShare}
            className="w-full px-4 py-3 bg-indigo-900/50 hover:bg-indigo-900/70 text-white rounded-lg font-semibold transition-all flex items-center justify-center space-x-2"
          >
            <ShareIcon className="w-5 h-5" />
            <span>Share Score</span>
          </button> */}
        </div>
      </div>
    </div>
  );
}
