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
import TwitterLogo from "../../assets/x-logo-white.png";
import MindGames from "../../assets/mind-games.png";
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
  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(account.bech32Address);
      // You could add a toast notification here if you want
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  };

  return (
    <>
      <div className="pb-10 flex flex-col h-screen w-full bg-gradient-to-br from-[#160f28] via-[#1a1339] to-black animate-gradient">
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-8 pb-24 flex flex-col items-center">
            <img
              className="h-23 w-auto rounded-2xl  transition-all duration-500 
                          hover:scale-110 transition-all duration-500 mb-10"
              src={MindGames}
              alt="Mind Games Logo"
            />
            <h1 className="text-4xl font-bold text-[#2adaff] mb-8 text-center">
              Settings
            </h1>

            <div className="max-w-2xl mx-auto space-y-6">
              {/* Account Section */}
              <div
                className="bg-[#1f1635]/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg 
                          border border-purple-500/10 hover:border-purple-500/20 transition-all"
              >
                <h2 className="text-2xl font-bold text-[#2adaff] mb-6">
                  Account
                </h2>

                {account.bech32Address ? (
                  <>
                    <div className="bg-[#160f28]/50 rounded-lg p-4 mb-6">
                      <div className="flex items-center gap-2 jusitify-center">
                        <div className="font-mono text-sm text-white break-all">
                          {account.bech32Address}
                        </div>
                        <button
                          onClick={copyAddress}
                          className="shrink-0 p-2 rounded-lg border border-[#2adaff] hover:bg-[#2adaff] hover:text-white 
                                   text-[#2adaff] transition-all"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 
                             text-white font-bold py-3 px-4 rounded-lg transition-all
                             shadow-lg hover:shadow-red-500/20 border border-red-400/30"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="space-y-4">
                    <p className="text-gray-300 text-center">
                      Connect your wallet to access all features
                    </p>
                    <button
                      onClick={() => (window.location.href = "/tg-app/")}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 
                             text-white font-bold py-3 px-4 rounded-lg transition-all
                             shadow-lg hover:shadow-purple-500/20 border border-purple-400/30"
                    >
                      Connect Wallet
                    </button>
                  </div>
                )}
              </div>

              {/* Network Settings - Only show when logged in */}
              {/* {account && (
                <div
                  className="bg-[#1f1635]/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg 
                            border border-purple-500/10 hover:border-purple-500/20 transition-all"
                >
                  <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-6">
                    Networks
                  </h2>
                  <div className="space-y-4">
                    {chainConfigs.map((chain) => (
                      <div
                        key={chain.id}
                        className="bg-[#160f28]/50 rounded-lg p-4 flex items-center justify-between
                               hover:bg-[#160f28]/70 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <img
                            src={chain.logo}
                            alt={`${chain.name} logo`}
                            className="w-8 h-8 rounded-full"
                          />
                          <span className="text-white font-medium">
                            {chain.name}
                          </span>
                        </div>
                        <button
                          onClick={() => handleToggleChain(chain.id)}
                          className={`px-4 py-2 rounded-lg font-medium transition-all
                                  ${
                                    chainVisibility[chain.id]
                                      ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                      : "bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
                                  }`}
                        >
                          {chainVisibility[chain.id] ? "Enabled" : "Disabled"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )} */}

              {/* Version Info - Always visible */}
              <div
                className="bg-[#1f1635]/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg 
                          border border-purple-500/10 hover:border-purple-500/20 transition-all"
              >
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-6">
                  About
                </h2>
                <div className="bg-[#160f28]/50 rounded-lg p-4 space-y-2">
                  <p className="text-gray-300">
                    Version: <span className="text-white">1.0.0</span>
                  </p>
                  <p className="text-gray-300 flex items-center gap-2">
                    <a
                      href="https://x.com/helwan_mande"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1"
                    >
                      <img
                        src={TwitterLogo}
                        alt="Twitter"
                        className="w-4 h-4"
                      />
                      @helwan_mande
                    </a>
                  </p>
                  <p className="text-gray-300 flex items-center gap-2">
                    <a
                      href="https://x.com/mindbend0x"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1"
                    >
                      <img
                        src={TwitterLogo}
                        alt="Twitter"
                        className="w-4 h-4"
                      />
                      @mindbend0x
                    </a>
                  </p>
                  <p className="text-gray-300 flex items-center gap-2">
                    <a
                      href="https://x.com/mindsetlabsDAO"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1"
                    >
                      <img
                        src={TwitterLogo}
                        alt="Twitter"
                        className="w-4 h-4"
                      />
                      @mindsetlabsDAO
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Navigation />
      </div>
    </>
  );
};
