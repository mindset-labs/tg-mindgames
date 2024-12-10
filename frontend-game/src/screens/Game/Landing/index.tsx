import MindGamesLogo from "../../../assets/mind-games-logo.png";
import { useNavigate } from "react-router-dom";
export const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen w-full bg-gradient-to-br from-[#160f28] via-[#1a1339] to-black animate-gradient">
      <div className="flex flex-col w-full items-center px-4 my-10">
        <img
          className="h-24 w-auto rounded-2xl hover:scale-105 transition-transform duration-300 shadow-lg"
          src={MindGamesLogo}
          alt="Mind Games Logo"
        />
        <div className="w-[328px] flex-col justify-start inline-flex mt-12">
          <div className="text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 text-3xl font-bold font-exo-2 leading-normal">
            Mind Games
          </div>
          <div className="text-center text-gray-300 text-base font-normal font-exo-2 leading-relaxed mt-4 max-w-sm mx-auto">
            A suite of on-chain games on the Xion Network with a dedicated
            Wallet
          </div>
        </div>

        <div className="flex w-full max-w-sm flex-col gap-4 items-center mt-auto fixed bottom-12">
          <button
            onClick={() => navigate("/tg-app/wallet/create")}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 
                     rounded-2xl backdrop-blur-md flex items-center justify-center transition-all 
                     border border-blue-400/30 shadow-lg hover:shadow-blue-500/20"
          >
            <span className="text-white text-base font-bold font-exo-2">
              Connect Wallet
            </span>
          </button>
          <button
            onClick={() => navigate("/tg-app/game")}
            className="w-full px-6 py-4 rounded-2xl border border-blue-500/50 hover:bg-blue-500/20 
                     backdrop-blur-md flex items-center justify-center transition-all 
                     shadow-lg hover:shadow-blue-500/10"
          >
            <span className="text-blue-400 hover:text-blue-300 text-base font-bold font-exo-2 transition-colors">
              Go to games
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
