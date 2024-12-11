import MindGamesLogo from "../../../assets/mind-games-logo.png";
import { useNavigate } from "react-router-dom";
export const Landing = () => {
  const navigate = useNavigate();

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
              className="h-24 w-auto rounded-2xl hover:scale-110 transition-all duration-500 
                         shadow-xl hover:shadow-blue-500/20 animate-float"
              src={MindGamesLogo}
              alt="Mind Games Logo"
            />

            <div className="w-full flex-col items-center justify-center inline-flex mt-4 mb-2">
              <div
                className="text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 
                             text-3xl font-bold font-exo-2 leading-normal animate-gradient-x"
              >
                Mind Games
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid gap-2 w-full">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group hover:bg-blue-500/10 p-3 rounded-xl border border-transparent
                           hover:border-blue-500/20 transition-all duration-300 flex justify-center"
                >
                  <div className="flex items-center gap-4">
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
            <button
              onClick={() => navigate("/tg-app/wallet/create")}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 
                       hover:from-blue-600 hover:to-blue-700 rounded-2xl backdrop-blur-md 
                       flex items-center justify-center transition-all duration-300
                       border border-blue-400/30 shadow-lg hover:shadow-xl 
                       hover:shadow-blue-500/30 hover:scale-[1.02]"
            >
              <span className="text-white text-base font-bold font-exo-2">
                Connect Wallet
              </span>
            </button>
            <button
              onClick={() => navigate("/tg-app/game")}
              className="w-full px-6 py-3 rounded-2xl border border-blue-500/50 
                       hover:bg-blue-500/20 backdrop-blur-md flex items-center 
                       justify-center transition-all duration-300 shadow-lg 
                       hover:shadow-xl hover:shadow-blue-500/20 hover:scale-[1.02]"
            >
              <span className="text-blue-400 hover:text-blue-300 text-base font-bold font-exo-2 transition-colors">
                Go to games
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
