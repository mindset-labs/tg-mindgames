import {
  useAbstraxionAccount,
  useAbstraxionSigningClient,
} from "@burnt-labs/abstraxion";
import Navigation from "../../components/Navigation";
import { useState } from "react";
import XionLogo from "../../assets/xion-logo.png";
import CosmosLogo from "../../assets/cosmos-logo.png";
import OsmosisLogo from "../../assets/osmosis-logo.png";
import CoreumLogo from "../../assets/coreum-logo.png";
import { motion } from "framer-motion";

export const Settings = () => {
  const { logout } = useAbstraxionSigningClient();
  const { data: account } = useAbstraxionAccount();

  // Chain visibility state
  const [chainVisibility, setChainVisibility] = useState({
    xion: true,
    cosmos: true,
    osmosis: true,
    coreum: true,
  });

  const chainConfigs = [
    { id: "xion", name: "Xion", logo: XionLogo },
    { id: "cosmos", name: "Cosmos Hub", logo: CosmosLogo },
    { id: "osmosis", name: "Osmosis", logo: OsmosisLogo },
    { id: "coreum", name: "Coreum", logo: CoreumLogo },
  ];

  const handleToggleChain = (chainId: string) => {
    setChainVisibility((prev) => ({
      ...prev,
      [chainId]: !prev[chainId],
    }));
  };

  const handleLogout = async () => {
    try {
      logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col min-h-screen w-full bg-gradient-to-b from-[#160f28] to-black relative"
    >
      <div className="absolute inset-0 overflow-y-auto">
        <div className="flex flex-col items-center justify-start px-4 pt-8 pb-32 max-w-md mx-auto">
          {/* Account Section */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 flex flex-col items-center w-full mb-6">
            <h2 className="text-white text-xl mb-4">Account</h2>
            <div className="w-full font-mono text-sm text-gray-400 break-all text-center mb-4">
              {account?.bech32Address}
            </div>
            <button
              onClick={handleLogout}
              className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-500 py-3 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      <Navigation className="relative z-10" />
    </motion.div>
  );
};
