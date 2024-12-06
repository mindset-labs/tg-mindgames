import React, { useState } from "react";
import {
  WalletIcon,
  CoinsIcon,
  ArrowRightIcon,
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
} from "lucide-react";

interface WalletBalance {
  coins: number;
  stars: number;
}

export default function SettingsPage() {
  const [balance, setBalance] = useState<WalletBalance>({
    coins: 1250,
    stars: 15,
  });
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Demo wallet address
  const walletAddress = "0x1234...5678";
  const fullWalletAddress = "0x1234567890123456789012345678901234567890";

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(fullWalletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || !recipientAddress) return;

    setIsWithdrawing(true);
    // Simulate withdrawal process
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setBalance((prev) => ({
      ...prev,
      coins: prev.coins - Number(withdrawAmount),
    }));

    setWithdrawAmount("");
    setRecipientAddress("");
    setIsWithdrawing(false);
  };

  const handleViewOnExplorer = () => {
    window.open(
      `https://explorer.example.com/address/${fullWalletAddress}`,
      "_blank"
    );
  };

  return (
    <div className="flex-1 flex flex-col p-4 pb-24">
      <div className="max-w-sm mx-auto w-full space-y-6">
        {/* Wallet Section */}
        <div className="bg-gradient-to-r from-indigo-950/90 to-blue-950/90 backdrop-blur-md rounded-2xl border border-indigo-800/30 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <WalletIcon className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-semibold text-white">Your Wallet</h3>
            </div>
            <button
              onClick={handleViewOnExplorer}
              className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
            >
              <span>View</span>
              <ExternalLinkIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-indigo-900/30 rounded-xl mb-4">
            <div className="text-sm text-indigo-300">{walletAddress}</div>
            <button
              onClick={handleCopyAddress}
              className="p-2 hover:bg-indigo-800/30 rounded-lg transition-colors"
            >
              {copied ? (
                <CheckIcon className="w-4 h-4 text-green-400" />
              ) : (
                <CopyIcon className="w-4 h-4 text-indigo-400" />
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-indigo-900/30 rounded-xl p-3">
              <div className="flex items-center space-x-1.5 text-sm text-indigo-300 mb-1">
                <CoinsIcon className="w-4 h-4" />
                <span>Game Coins</span>
              </div>
              <div className="text-xl font-bold text-white">
                {balance.coins}
              </div>
            </div>
            <div className="bg-indigo-900/30 rounded-xl p-3">
              <div className="flex items-center space-x-1.5 text-sm text-yellow-400/90 mb-1">
                <WalletIcon className="w-4 h-4" />
                <span>Stars</span>
              </div>
              <div className="text-xl font-bold text-yellow-400">
                {balance.stars}
              </div>
            </div>
          </div>
        </div>

        {/* Withdraw Section */}
        <div className="bg-gradient-to-r from-indigo-950/90 to-blue-950/90 backdrop-blur-md rounded-2xl border border-indigo-800/30 p-4">
          <div className="flex items-center space-x-2 mb-4">
            <ArrowRightIcon className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-semibold text-white">Withdraw Coins</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-indigo-300 mb-1.5">
                Amount
              </label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full bg-indigo-900/30 border border-indigo-800/30 rounded-xl px-4 py-2.5 text-white placeholder-indigo-400/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                max={balance.coins}
              />
            </div>

            <div>
              <label className="block text-sm text-indigo-300 mb-1.5">
                Recipient Address
              </label>
              <input
                type="text"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="0x..."
                className="w-full bg-indigo-900/30 border border-indigo-800/30 rounded-xl px-4 py-2.5 text-white placeholder-indigo-400/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <button
              onClick={handleWithdraw}
              disabled={
                isWithdrawing ||
                !withdrawAmount ||
                !recipientAddress ||
                Number(withdrawAmount) > balance.coins
              }
              className={`w-full px-4 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all
                ${
                  isWithdrawing ||
                  !withdrawAmount ||
                  !recipientAddress ||
                  Number(withdrawAmount) > balance.coins
                    ? "bg-indigo-900/50 text-indigo-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white active:scale-[0.98]"
                }`}
            >
              {isWithdrawing ? "Processing..." : "Withdraw"}
            </button>

            {Number(withdrawAmount) > balance.coins && (
              <p className="text-sm text-red-400 text-center">
                Insufficient balance
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
