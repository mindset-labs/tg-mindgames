import Navigation from "../../../components/Navigation";
import { CwCooperationDilemmaClient } from "../../../../codegen/CwCooperationDilemma.client";
import { useQuery } from "@tanstack/react-query";
import { useAbstraxionSigningClient } from "@burnt-labs/abstraxion";
import WebApp from "@twa-dev/sdk";

export const GameHome = () => {
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
        "xion12cfz7k5a6hj744jdsj52r57dth4tlnggcfqdyw6620rja0f6ltdsl8c2rh"
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
      <div className="flex flex-col h-screen w-full bg-gradient-to-b from-[#160f28] to-black">
        <main className="flex-1 container mx-auto px-4 py-8 mt-16 overflow-y-auto h-[calc(100vh-64px)] max-w-7xl">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">
            Welcome, {telegramName ?? "Gamer"}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Player Stats Card */}
            <div className="bg-[#1f1635] rounded-lg p-6 shadow-lg">
              <h2 className="text-2xl font-semibold text-white mb-4">Stats</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Games Played</span>
                  <span className="text-white font-medium">{gamesCount}</span>
                </div>
              </div>
            </div>

            {/* Recent Activity Card */}
            <div className="bg-[#1f1635] rounded-lg p-6 shadow-lg">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Recent Activity
              </h2>
              <div className="space-y-4">
                {[1, 2, 3].map((_, index) => (
                  <div
                    key={index}
                    className="border-b border-gray-700 pb-3 last:border-0"
                  >
                    <p className="text-white">Game Session #{index + 1}</p>
                    <p className="text-sm text-gray-400">2 hours ago</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Available Games Card */}
            <div className="bg-[#1f1635] rounded-lg p-6 shadow-lg">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Available Games
              </h2>
              <div className="space-y-4">
                <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors">
                  Quick Match
                </button>
                <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors">
                  Ranked Game
                </button>
                <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors">
                  Practice Mode
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
