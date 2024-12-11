import Navigation from "../../../components/Navigation";
import { CwCooperationDilemmaClient } from "../../../../codegen/CwCooperationDilemma.client";
import { useQuery } from "@tanstack/react-query";
import {
  useAbstraxionAccount,
  useAbstraxionSigningClient,
} from "@burnt-labs/abstraxion";
import WebApp from "@twa-dev/sdk";
import { useNavigate } from "react-router-dom";
import { queryAllChainBalances } from "../../../helpers/Wallet/queryBalances";
import { useEffect, useState } from "react";
import XionLogo from "../../../assets/xion-logo.png";
import MindGameLogo from "../../../assets/mind-games-logo.png";
import Welcome from "../../../assets/welcome.png";

export const GameHome = () => {
  const navigate = useNavigate();
  const { client } = useAbstraxionSigningClient();
  const { data: account } = useAbstraxionAccount();
  const [balances, setBalances] = useState<{ [chain: string]: number }>({});

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
  const { data: balancesData } = useQuery({
    queryKey: ["balances", account.bech32Address],
    queryFn: async () => {
      if (!client) {
        throw new Error("Client not initialized");
      }
      const xionBalance = await client?.getBalance(
        account.bech32Address,
        "uxion"
      );
      //TODO: get minds balance from contract
      const mindsBalance = await client?.queryContractSmart(
        "xion17ep30wmgw7xqefagdlx7kz3t746q9rj5xy37tf7g9v68d9d7ncaskl3qrz",
        {
          balance: {
            address: account.bech32Address,
          },
        }
      );
      console.log({ mindsBalance });
      return {
        xion: Number(xionBalance?.amount ?? 0) / 10 ** 6,
        minds: Number(mindsBalance?.balance ?? 0) / 10 ** 2,
      };
    },
    enabled: !!account.bech32Address,
  });

  useEffect(() => {
    if (balancesData) {
      setBalances(balancesData);
    }
  }, [balancesData]);

  return (
    <>
      <div className="pb-24 flex flex-col h-screen w-full bg-gradient-to-br from-[#160f28] via-[#1a1339] to-black animate-gradient">
        <main className="flex-1 container mx-auto px-4 py-8 mt-3 overflow-y-auto h-[calc(100vh-64px)] max-w-7xl">
          <div className="flex items-center justify-center gap-4 mb-8 whitespace-nowrap">
            <h1 className=" text-white inline-flex items-center">
              <img
                src={Welcome}
                alt="Welcome"
                className="rounded-md inline-flex items-center"
              />
            </h1>
          </div>
          <div className="flex justify-center gap-4 mb-4 whitespace-nowrap">
            <img
              src={MindGameLogo}
              alt="Mind Game"
              className="w-12 h-12 rounded-md"
            />
            <h1 className="text-4xl font-bold text-center justify-center text-white inline-flex items-center">
              {telegramName != undefined ? "@" + telegramName : "Gamer"}
            </h1>
          </div>

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
                    <div className="w-8 h-8 rounded-full overflow-hidden">
                      <img
                        src={XionLogo}
                        alt="XION"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-white font-medium">XION</span>
                  </div>
                  <span className="text-white font-bold">{balances.xion}</span>
                </div>

                <div className="bg-[#160f28]/50 rounded-lg p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden">
                      <img
                        src={MindGameLogo}
                        alt="Game Token"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-white font-medium">$MINDS</span>
                  </div>
                  <span className="text-white font-bold">{balances.minds}</span>
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
