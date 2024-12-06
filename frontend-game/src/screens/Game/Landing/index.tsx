import MindGamesLogo from "../../../assets/mind-games-logo.png";
import { useNavigate } from "react-router-dom";
export const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen w-full bg-gradient-to-b from-[#160f28] to-black">
      <div className="flex flex-col w-full items-center px-4 my-10">
        <img
          className="h-20 w-auto rounded-2xl"
          src={MindGamesLogo}
          alt="Mind Games Logo"
        />
        <div className="w-[328px] flex-col justify-start inline-flex mt-10">
          <div className="text-center text-white text-xl font-semibold font-exo-2 leading-normal">
            Mind Games
          </div>
          <div className="text-center text-gray-400 text-sm font-normal font-exo-2 leading-normal mt-2">
            A suite of on-chain games on the Xion Network with a dedicated
            Wallet
          </div>
        </div>

        <div className="flex w-full max-w-xs flex-col gap-3 items-center mt-auto fixed bottom-8">
          <button
            onClick={() => navigate("/tg-app/wallet/create")}
            className="w-full px-6 py-4 bg-blue-500 hover:bg-blue-600 rounded-2xl backdrop-blur-md 
                     flex items-center justify-center transition-all border border-blue-400/30"
          >
            <span className="text-white text-base font-bold font-exo-2">
              Connect Wallet
            </span>
          </button>
          <button
            onClick={() => navigate("/tg-app/game")}
            className="w-full px-6 py-4 rounded-2xl border border-blue-500/50 hover:bg-blue-500/10 
                     backdrop-blur-md flex items-center justify-center transition-all"
          >
            <span className="text-blue-500 text-base font-bold font-exo-2">
              Go to games
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
