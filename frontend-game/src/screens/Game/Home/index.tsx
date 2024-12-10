import Navigation from "../../../components/Navigation";
import { CwCooperationDilemmaClient } from "../../../../codegen/CwCooperationDilemma.client";
import { useQuery } from "@tanstack/react-query";
import { useAbstraxionSigningClient } from "@burnt-labs/abstraxion";
import WebApp from "@twa-dev/sdk";
import { useNavigate } from "react-router-dom";

export const GameHome = () => {
  const navigate = useNavigate();
  const { client } = useAbstraxionSigningClient();

  const { data: gamesCount } = useQuery({
    queryKey: ["gamesCount"],
    queryFn: async () => {
      if (!client) {
        throw new Error("Client not initialized");
      }
      const queryClient = new CwCooperationDilemmaClient(
        client,
        "xion1p6z52rfzkehhjm64cdd6396swzhqqj787u205kux06vr4uyp8lxqe5v8gr",
        "xion1lp7xue46k9909xycngp5ms459hsldc5cqqquqw0an0g4qnsahm4snyczyx"
      );
      return queryClient.getGamesCount();
    },
    enabled: !!client,
  });

  console.log(gamesCount);

  const { data: telegramName } = useQuery({
    queryKey: ["telegramName"],
    queryFn: async () => {
      if (!client) {
        throw new Error("Client not initialized");
      }
      const telegramName = await WebApp.initDataUnsafe?.user?.username;
      return telegramName;
    },
    enabled: !!client,
  });

  console.log(telegramName);

  return (
    <>
      <div className="pb-24 flex flex-col h-screen w-full bg-gradient-to-br from-[#160f28] via-[#1a1339] to-black animate-gradient">
        <main className="flex-1 container mx-auto px-4 py-8 mt-3 overflow-y-auto h-[calc(100vh-64px)] max-w-7xl">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">
            Welcome, {telegramName ?? "Gamer"}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-[#1f1635]/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-purple-500/10 hover:border-purple-500/20 transition-all">
              <h2 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-4">
                Stats
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-[#160f28]/50 rounded-lg">
                  <span className="text-gray-300">Games Played</span>
                  <span className="text-white font-medium bg-purple-500/20 px-3 py-1 rounded-full">
                    {gamesCount}
                  </span>
                </div>
              </div>
            </div>

            <div
              className="bg-[#1f1635]/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg 
                            border border-purple-500/10 hover:border-purple-500/20 transition-all"
            >
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-6">
                My Tokens
              </h2>
              <div className="space-y-4">
                <div className="bg-[#160f28]/50 rounded-lg p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                      <span className="text-white font-bold">$</span>
                    </div>
                    <span className="text-white font-medium">XION</span>
                  </div>
                  <span className="text-white font-bold">0.00</span>
                </div>

                <div className="bg-[#160f28]/50 rounded-lg p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                      <span className="text-white font-bold">G</span>
                    </div>
                    <span className="text-white font-medium">Game Tokens</span>
                  </div>
                  <span className="text-white font-bold">0.00</span>
                </div>
              </div>
            </div>

            <div className="bg-[#1f1635]/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-purple-500/10 hover:border-purple-500/20 transition-all">
              <h2 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-4">
                Tests
              </h2>
              <div className="space-y-4">
                <button
                  onClick={() => navigate("/tg-app/test")}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 
                           text-white py-3 px-4 rounded-lg transition-all shadow-lg hover:shadow-purple-500/20
                           border border-purple-400/30"
                >
                  Cw_counter
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Navigation />
    </>
  );
};
