import React, { useState } from "react";
import { useSwipeable } from "react-swipeable";
import Navigation from "../../../components/Navigation";
import { useAbstraxionAccount } from "@burnt-labs/abstraxion";
import {
  generateCosmosAddress,
  COSMOS_PREFIXES,
} from "../../../helpers/Wallet/generateCosmosAddresses";
import XionLogo from "../../../assets/xion-logo.png";
import CosmosLogo from "../../../assets/cosmos-logo.png";
import OsmosisLogo from "../../../assets/osmosis-logo.png";
import CoreumLogo from "../../../assets/coreum-logo.png";
import { QRCodeSVG } from "qrcode.react";

export const Receive = () => {
  const {
    data: { bech32Address },
  } = useAbstraxionAccount();

  const chainOrder = ["xion", "cosmos", "osmosis", "coreum"];
  const [selectedChain, setSelectedChain] = useState("xion");

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

  // Function to get generated address for current chain
  const getChainAddress = (chain: string): string => {
    if (!bech32Address) return "";

    switch (chain) {
      case "xion":
        return bech32Address;
      case "cosmos":
        return generateCosmosAddress(bech32Address, COSMOS_PREFIXES.COSMOS_HUB);
      case "osmosis":
        return generateCosmosAddress(bech32Address, COSMOS_PREFIXES.OSMOSIS);
      case "coreum":
        return generateCosmosAddress(bech32Address, "testcore"); // Add COREUM to your COSMOS_PREFIXES if needed
      default:
        return "";
    }
  };

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

  // Get current chain's address
  const currentAddress = getChainAddress(selectedChain);

  // Function to copy address to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentAddress);
      // Optionally add a toast notification here
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  return (
    <>
      <div
        {...swipeHandlers}
        className={`flex flex-col min-h-screen w-full ${chainBackgrounds[selectedChain]}`}
      >
        <div className="flex-1 overflow-y-auto pb-32">
          <div className="flex flex-col items-center justify-start px-4 pt-8">
            {/* Chain Selector */}
            <div className="flex items-center gap-2 bg-white/10 rounded-lg p-2 backdrop-blur-lg mb-8">
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
            </div>

            {/* QR Code and Address Display */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 flex flex-col items-center max-w-md w-full mb-8">
              <div className="bg-white p-4 rounded-lg mb-6">
                <QRCodeSVG value={currentAddress} size={200} />
              </div>

              <div className="w-full">
                <div className="text-gray-400 text-sm mb-2">
                  Your {chainNames[selectedChain]} Address:
                </div>
                <div
                  className="bg-white/5 p-4 rounded-lg font-mono text-sm text-white break-all cursor-pointer hover:bg-white/10"
                  onClick={copyToClipboard}
                >
                  {currentAddress}
                </div>
                <div className="text-gray-400 text-xs mt-2 text-center">
                  Tap address to copy to clipboard
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Navigation />
    </>
  );
};
