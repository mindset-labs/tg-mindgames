import React from "react";
import {
  RocketIcon,
  ShieldIcon,
  ZapIcon,
  StarIcon,
  GlobeIcon,
  LockIcon,
  ShareIcon,
  EyeIcon,
} from "lucide-react";

const GAME_MODES = [
  {
    id: "classic",
    name: "Space Shooter",
    description: "Survive as long as possible",
    icon: RocketIcon,
    color: "blue",
  },
  {
    id: "defense",
    name: "Dictator",
    description: "Trick the enemy",
    icon: ShieldIcon,
    color: "emerald",
  },
];

const STAKE_OPTIONS = [1, 2, 5, 10];

interface GameSetupOptions {
  stake: number;
  isPrivate: boolean;
  mode: string;
}

interface GameOnboardingProps {
  onStart: () => void;
  options: GameSetupOptions;
  onOptionsChange: (options: GameSetupOptions) => void;
}

export default function GameOnboarding({
  onStart,
  options,
  onOptionsChange,
}: GameOnboardingProps) {
  const [showPreview, setShowPreview] = React.useState(false);

  const handleShareGame = () => {
    const gameLink = `https://stackblitz.com/game/${Date.now()}`;
    window.open(gameLink, "_blank");
  };

  return (
    <div className="absolute inset-0  flex flex-col items-center pb-24">
      <div className="w-full max-h-full overflow-y-auto py-4 px-4 flex flex-col items-center">
        <div className="max-w-sm w-full flex flex-col items-center relative z-10">
          <h2 className="text-2xl font-bold text-white mb-4">Play to Earn</h2>

          {/* Game Mode Selection */}
          <div className="w-full mb-6">
            <label className="block text-base text-white/90 mb-2">
              Game Selection
            </label>
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

          {/* Stake Selection */}
          <div className="w-full mb-4">
            <label className="block text-base text-white/90 mb-2">
              Select Stake Amount
            </label>
            <div className="grid grid-cols-2 gap-2">
              {STAKE_OPTIONS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => onOptionsChange({ ...options, stake: amount })}
                  className={`flex items-center justify-center space-x-1.5 p-2.5 rounded-lg border-2 transition-all
                    ${
                      amount === options.stake
                        ? "border-yellow-400 bg-yellow-400/20"
                        : "border-white/20 hover:border-white/40"
                    }`}
                >
                  <StarIcon className="w-4 h-4 text-yellow-400" />
                  <span className="text-base font-semibold text-white">
                    {amount}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Game Type Selection */}
          <div className="w-full mb-4">
            <label className="block text-base text-white/90 mb-2">
              Game Visibility
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() =>
                  onOptionsChange({ ...options, isPrivate: false })
                }
                className={`flex items-center justify-center space-x-1.5 p-2.5 rounded-lg border-2 transition-all
                  ${
                    !options.isPrivate
                      ? "border-blue-400 bg-blue-400/20"
                      : "border-white/20 hover:border-white/40"
                  }`}
              >
                <GlobeIcon className="w-4 h-4" />
                <span className="font-medium">Public</span>
              </button>
              <button
                onClick={() => onOptionsChange({ ...options, isPrivate: true })}
                className={`flex items-center justify-center space-x-1.5 p-2.5 rounded-lg border-2 transition-all
                  ${
                    options.isPrivate
                      ? "border-blue-400 bg-blue-400/20"
                      : "border-white/20 hover:border-white/40"
                  }`}
              >
                <LockIcon className="w-4 h-4" />
                <span className="font-medium">Private</span>
              </button>
            </div>
          </div>

          {/* Preview Section for Private Games */}
          {options.isPrivate && (
            <div className="w-full mb-4">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="w-full flex items-center justify-between p-3 bg-indigo-900/50 rounded-lg hover:bg-indigo-900/70 transition-all"
              >
                <div className="flex items-center space-x-2">
                  <EyeIcon className="w-4 h-4 text-indigo-300" />
                  <span className="text-sm text-indigo-200">Preview Link</span>
                </div>
                <div className="text-xs text-indigo-300 truncate ml-2">
                  stackblitz.com/game/xyz...
                </div>
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col w-full gap-2">
            <button
              onClick={onStart}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg font-semibold transition-all active:scale-[0.98]"
            >
              Start Game
            </button>

            {options.isPrivate && (
              <button
                onClick={handleShareGame}
                className="w-full px-4 py-2.5 bg-indigo-900/50 hover:bg-indigo-900/70 text-white rounded-lg font-semibold flex items-center justify-center space-x-2"
              >
                <ShareIcon className="w-4 h-4" />
                <span>Share Game Link</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
