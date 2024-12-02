import MindGamesLogo from "../../../assets/mind-games-logo.png";
import { useNavigate } from "react-router-dom";
export const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen w-full bg-wallet-landing bg-no-repeat bg-cover bg-center top-0 left-0">
      <div className="flex flex-col w-full items-center px-4 my-10">
        <img className="origin-top-left h-20" src={MindGamesLogo} />
        <div className="w-[328px] flex-col justify-start inline-flex mt-10">
          <div className="text-center text-[#160f28] text-base font-semibold font-exo-2 leading-normal">
            Mind Games
          </div>
          <div className="text-center text-[#160f28] text-sm font-normal font-exo-2 leading-normal mt-2">
            A suite of on-chain games on the Xion Network with a dedicated
            Wallet
          </div>
        </div>

        <div className="flex w-full max-w-xs flex-col gap-2 items-center mt-auto mb-8 fixed bottom-0">
          <button
            onClick={() => navigate("/tg-app/wallet/create")}
            className="self-stretch  px-3 py-4 bg-blue-500 rounded-[32px] backdrop-blur-2xl flex-col justify-center items-center gap-0.5 flex"
          >
            <p className="text-center text-white text-base font-bold font-exo-2 leading-tight tracking-tight">
              Create Wallet
            </p>
          </button>
          <button
            onClick={() => navigate("/tg-app/game")}
            className="self-stretch px-3 py-4 rounded-[32px] border border-blue-500 backdrop-blur-2xl flex-col justify-center items-center gap-0.5 flex"
          >
            <p className="text-center text-blue-500 text-base font-bold font-exo-2 leading-tight tracking-tight">
              {" "}
              Go to games
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};
