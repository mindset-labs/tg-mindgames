import React, { useState, useEffect } from "react";
import {
  useAbstraxionAccount,
  useAbstraxionSigningClient,
  Abstraxion,
  useModal,
} from "@burnt-labs/abstraxion";
import MindGamesLogo from "../../../assets/mind-games-logo.png";
import Navigation from "../../../components/Navigation";
import { useNavigate } from "react-router-dom";
import XionLogo from "../../../assets/xion-logo.png";
import CosmosLogo from "../../../assets/cosmos-logo.png";
import OsmosisLogo from "../../../assets/osmosis-logo.png";
import CoreumLogo from "../../../assets/coreum-logo.png";
import { useSwipeable } from "react-swipeable";
import {
  queryAllChainBalances,
  TokenBalance,
} from "../../../helpers/Wallet/queryBalances";

const lightningBorderStyles = `
@keyframes lightningBorder {
  0% {
    border-color: rgba(255, 255, 255, 0.2);
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
  }
  50% {
    border-color: rgba(255, 255, 255, 0.8);
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
  }
  100% {
    border-color: rgba(255, 255, 255, 0.2);
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
  }
}

.lightning-border {
  position: relative;
  border: 2px solid transparent;
  border-radius: 12px; /* Adjusted for rectangular logo */
  animation: lightningBorder 5s infinite;
  padding: 2px;
}

.lightning-border::before {
  content: '';
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border-radius: 12px; /* Adjusted for rectangular logo */
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: rotate 2s linear infinite;
}
`;

export const WalletHome = () => {
  const navigate = useNavigate();
  const [selectedChain, setSelectedChain] = useState("xion"); // Default chain
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const {
    data: { bech32Address },
    isConnected,
  } = useAbstraxionAccount();

  const { signArb, logout } = useAbstraxionSigningClient();
  const [, setShow] = useModal();

  const chainAddresses = {
    xion: "xion1...",
    cosmos: "cosmos1...",
    osmosis: "osmo1...",
    coreum: "core1...",
  };

  const chainLogos = {
    xion: XionLogo,
    cosmos: CosmosLogo,
    osmosis: OsmosisLogo,
    coreum: CoreumLogo,
  };

  const chainNames = {
    xion: "Xion",
    cosmos: "Cosmos Hub",
    osmosis: "Osmosis",
    coreum: "Coreum",
  };

  const chainBackgrounds = {
    xion: "bg-gradient-to-b from-[#160f28] to-black",
    cosmos: "bg-gradient-to-b from-[#2a2a72] to-[#009ffd]",
    osmosis: "bg-gradient-to-b from-[#1e3c72] to-[#2a5298]",
    coreum: "bg-gradient-to-b from-[#ff7e5f] to-[#feb47b]",
  };

  const chainOrder = ["xion", "cosmos", "osmosis", "coreum"];

  const handleSwipe = (direction: string) => {
    const currentIndex = chainOrder.indexOf(selectedChain);
    let newIndex = currentIndex;

    if (direction === "LEFT") {
      newIndex = (currentIndex + 1) % chainOrder.length;
    } else if (direction === "RIGHT") {
      newIndex = (currentIndex - 1 + chainOrder.length) % chainOrder.length;
    }

    setSelectedChain(chainOrder[newIndex]);
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleSwipe("LEFT"),
    onSwipedRight: () => handleSwipe("RIGHT"),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
  });

  const copyToClipboard = () => {
    if (chainAddresses[selectedChain]) {
      navigator.clipboard.writeText(chainAddresses[selectedChain]);
      // Optionally add a toast/notification here
    }
  };

  const truncateAddress = (address: string | undefined) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = lightningBorderStyles;
    document.head.appendChild(styleSheet);
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  useEffect(() => {
    const fetchBalances = async () => {
      if (!bech32Address) return;

      setIsLoading(true);
      try {
        const allBalances = await queryAllChainBalances(bech32Address);
        console.log({ allBalances });
        setBalances(allBalances);
      } catch (error) {
        console.error("Error fetching balances:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalances();
  }, [bech32Address]);

  if (!isConnected) {
    return (
      <div className="flex flex-col min-h-screen w-full bg-gradient-to-b from-[#160f28] to-black">
        <div className="flex flex-col w-full items-center px-4 min-h-screen">
          {/* Logo */}
          <img
            src={MindGamesLogo}
            alt="Mind Games Logo"
            className="h-20 w-auto rounded-2xl mt-10"
          />

          {/* Main Content */}
          <main className="flex flex-col items-center justify-center flex-grow w-full max-w-xs gap-6">
            <h1 className="text-2xl font-bold text-white font-exo-2">
              Connect Wallet
            </h1>

            <button
              onClick={() => setShow(true)}
              className="w-full px-6 py-4 bg-blue-500 hover:bg-blue-600 rounded-2xl backdrop-blur-md 
                       flex items-center justify-center transition-all border border-blue-400/30"
            >
              <span className="text-white text-base font-bold font-exo-2">
                CONNECT
              </span>
            </button>
          </main>

          <Abstraxion onClose={() => setShow(false)} />
        </div>
        <Navigation />
      </div>
    );
  }

  return (
    <div
      {...swipeHandlers}
      className={`flex flex-col min-h-screen w-full ${chainBackgrounds[selectedChain]} text-white`}
    >
      {/* Header with Logo, Chain Selector, and Settings */}
      <div className="flex items-center justify-between p-4">
        <div className="lightning-border">
          <img
            src={MindGamesLogo}
            alt="Mind Games Logo"
            className="h-8 w-auto rounded-md"
          />
        </div>

        <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-2 backdrop-blur-lg flex-grow mx-4">
          <img
            src={chainLogos[selectedChain]}
            alt={chainNames[selectedChain]}
            className="h-6 w-6"
          />
          <select
            value={selectedChain}
            onChange={(e) => setSelectedChain(e.target.value)}
            className="appearance-none bg-transparent text-white border-none focus:outline-none"
          >
            {chainOrder.map((chain) => (
              <option key={chain} value={chain}>
                {chainNames[chain]}
              </option>
            ))}
          </select>
          <div className="text-gray-400 flex items-center gap-2 ml-auto">
            <span className="text-sm truncate max-w-[120px]">
              {truncateAddress(chainAddresses[selectedChain])}
            </span>
            <button onClick={copyToClipboard}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
          </div>
        </div>

        <button
          onClick={() => navigate("/tg-app/settings")}
          className="text-gray-400"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center flex-grow px-4">
        {/* Balance Display */}
        <div className="text-4xl font-bold my-8 flex items-center">
          {isLoading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          ) : balances.length > 0 ? (
            `$${balances
              .reduce((acc, bal) => acc + parseFloat(bal.displayAmount) * 1, 0)
              .toFixed(2)}`
          ) : (
            "$0.00"
          )}
          <button className="ml-2 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-6 w-full max-w-md mb-8">
          <button
            onClick={() => navigate("/tg-app/wallet/receive")}
            className="flex flex-col items-center flex-1"
          >
            <div className="bg-gray-800/50 p-4 rounded-2xl mb-2 backdrop-blur-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div>
            <span className="text-sm text-gray-300">Receive</span>
          </button>

          <button className="flex flex-col items-center flex-1">
            <div className="bg-gray-800/50 p-4 rounded-2xl mb-2 backdrop-blur-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
            </div>
            <span className="text-sm text-gray-300">Swap</span>
          </button>

          <button
            onClick={() => navigate("/tg-app/wallet/send")}
            className="flex flex-col items-center flex-1"
          >
            <div className="bg-gray-800/50 p-4 rounded-2xl mb-2 backdrop-blur-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
            </div>
            <span className="text-sm text-gray-300">Send</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 text-sm text-gray-400 mb-4">
          <button className="border-b-2 border-white text-white pb-1">
            Tokens
          </button>
          <button className="pb-1">Activity</button>
        </div>

        {/* Add Token List Section */}
        <div className="w-full max-w-md">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : balances.length > 0 ? (
            <div className="space-y-4">
              {balances.map((balance, index) => (
                <div
                  key={index}
                  className="bg-gray-800/50 backdrop-blur-lg rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      //TODO: change this to the correct logo
                      src={chainLogos.coreum}
                      alt={balance.chainInfo.chainName}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <div className="text-white font-medium">
                        {balance.displayAmount} {balance.chainInfo.displayDenom}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {balance.chainInfo.chainName}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    ≈ ${(parseFloat(balance.displayAmount) * 1).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              No tokens found
            </div>
          )}
        </div>
      </div>
      <Navigation />
    </div>
  );
};
