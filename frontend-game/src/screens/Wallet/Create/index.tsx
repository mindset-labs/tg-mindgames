import {
  Abstraxion,
  useAbstraxionAccount,
  useModal,
} from "@burnt-labs/abstraxion";
import { Button } from "@burnt-labs/ui";

import { useEffect } from "react";
import Navigation from "../../../components/Navigation";
import MindGamesLogo from "../../../assets/mind-games-logo.png";

export const CreateWallet = () => {
  const {
    data: { bech32Address },
    isConnected,
    isConnecting,
  } = useAbstraxionAccount();

  const [, setShow] = useModal();

  useEffect(() => {
    console.log({ isConnected, isConnecting });
  }, [isConnected, isConnecting]);

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
            Create Wallet
          </h1>

          <button
            onClick={() => setShow(true)}
            className="w-full px-6 py-4 bg-blue-500 hover:bg-blue-600 rounded-2xl backdrop-blur-md 
                     flex items-center justify-center transition-all border border-blue-400/30"
          >
            <span className="text-white text-base font-bold font-exo-2">
              {bech32Address ? "VIEW ACCOUNT" : "CONNECT"}
            </span>
          </button>

          {bech32Address && (
            <div className="w-full bg-indigo-950/50 rounded-2xl p-4 backdrop-blur-md border border-indigo-900/50">
              <div className="text-sm font-semibold text-gray-300 mb-2">
                Address
              </div>
              <div className="text-sm text-gray-400 break-all font-mono">
                {bech32Address}
              </div>
            </div>
          )}
        </main>

        <Abstraxion onClose={() => setShow(false)} />
      </div>
      <Navigation />
    </div>
  );
};
