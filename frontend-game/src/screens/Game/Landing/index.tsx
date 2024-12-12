import MindGamesLogo from "../../../assets/mind-games-logo.png";
import Mind from "../../../assets/mind.png";
import MindGames from "../../../assets/mind-games.png";
import { useNavigate } from "react-router-dom";
import {
  useAbstraxionAccount,
  useAbstraxionSigningClient,
} from "@burnt-labs/abstraxion";

export const Landing = () => {
  const navigate = useNavigate();

  const {
    data: { bech32Address },
    isConnected,
    isConnecting,
  } = useAbstraxionAccount();

  const features = [
    {
      title: "Meta Accounts",
      icon: "🎮",
    },
    {
      title: "Treasury Accounts",
      icon: "🏦",
    },
    {
      title: "Cosmwasm Smart Contracts",
      icon: "🔗",
    },
  ];

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-gradient-to-br from-[#160f28] via-[#1a1339] to-black animate-gradient">
      <div className="flex flex-col items-center w-full max-w-md px-4">
        {/* Content Container */}
        <div className="flex flex-col items-center gap-8">
          <div className="flex flex-col items-center">
            <img
              className="h-26 w-auto transition-all duration-500 
                         hover:scale-110 transition-all duration-500 mb-10"
              src={MindGames}
              alt="Mind Games Logo"
            />

            {/* Feature Cards */}
            <div className="grid gap-2 w-full">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group hover:bg-blue-500/10 p-3 rounded-xl border border-transparent
                           hover:border-blue-500/20 transition-all duration-300 flex justify-center"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl group-hover:scale-125 transition-transform duration-300">
                      {feature.icon}
                    </span>
                    <h3 className="text-blue-300 text-base font-bold font-exo-2">
                      {feature.title}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
            <div
              className="text-center text-gray-300/90 text-base font-medium font-exo-2 leading-relaxed 
                             mt-2 mx-auto"
            >
              A suite of on-chain games leveraging the capabilities of the Xion
              Network
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex w-full flex-col gap-3 items-center">
            {isConnected ? (
              <button
                onClick={() => navigate("/tg-app/game")}
                className="w-full rounded-2xl from-pink-500 via-red-500 to-yellow-500 bg-[length:_400%_400%] p-[3px] bg-gradient-to-r 
                                     text-white font-bold py-3 px-4 transition-all
                                     shadow-lg shadow-[#2adaff]/20"
              >
                {/* <span className="text-blue-400 hover:text-blue-300 text-base font-bold font-exo-2 transition-colors"> */}
                Let's Play!
                {/* </span> */}
              </button>
            ) : (
              <button
                onClick={() => navigate("/tg-app/wallet/create")}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 
                       hover:from-blue-600 hover:to-blue-700 rounded-2xl backdrop-blur-md 
                       flex items-center justify-center transition-all duration-300
                       border border-blue-400/30 shadow-lg hover:shadow-xl 
                       shadow-blue-500/30 hover:scale-[1.02]"
              >
                <span className="text-white text-base font-bold font-exo-2">
                  Connect Wallet
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
