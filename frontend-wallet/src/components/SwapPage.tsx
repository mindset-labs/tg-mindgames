import React, { useState } from "react";
import { CoinsIcon, StarIcon, ArrowRightIcon } from "lucide-react";

interface SwapRates {
  stars: number;
  coins: number;
}

const SWAP_RATES: SwapRates[] = [
  { stars: 1, coins: 100 },
  { stars: 5, coins: 600 },
  { stars: 10, coins: 1500 },
];

export default function SwapPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isTelegram = window.Telegram?.WebApp !== undefined;

  const handleSwap = async (stars: number, coins: number) => {
    if (!isTelegram) {
      setError("Please open this app in Telegram");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await window.Telegram.WebApp.requestStars({
        amount: stars,
        purpose: "Game Currency",
        description: `Exchange ${stars} Stars for ${coins} Coins`,
      });

      if (result.success) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
        // Here you would typically update the user's coin balance in your backend
      } else {
        throw new Error("Transaction failed");
      }
    } catch (err) {
      setError("Failed to complete the swap. Please try again.");
      window.Telegram.WebApp.HapticFeedback.notificationOccurred("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-4 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-2">
          Star Swap
        </h2>
        <p className="text-indigo-200/70">
          Exchange Telegram Stars for game coins
        </p>
      </div>

      <div className="grid gap-4">
        {SWAP_RATES.map(({ stars, coins }) => (
          <div
            key={stars}
            className="bg-gradient-to-r from-indigo-950/90 to-blue-950/90 backdrop-blur-md rounded-2xl border border-indigo-800/30 p-4 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <button
              onClick={() => handleSwap(stars, coins)}
              disabled={isLoading || !isTelegram}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                  <StarIcon className="w-6 h-6 text-yellow-400" />
                </div>
                <span className="text-xl font-semibold text-yellow-400">
                  {stars}
                </span>
              </div>

              <ArrowRightIcon className="w-5 h-5 text-indigo-400" />

              <div className="flex items-center space-x-2">
                <span className="text-xl font-semibold text-blue-400">
                  {coins}
                </span>
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <CoinsIcon className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </button>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-center">
          {error}
        </div>
      )}

      {!isTelegram && (
        <div className="p-4 bg-indigo-900/30 border border-indigo-800/30 rounded-xl text-center">
          <p className="text-indigo-200">
            Please open this game in Telegram to swap Stars for Coins
          </p>
        </div>
      )}
    </div>
  );
}
