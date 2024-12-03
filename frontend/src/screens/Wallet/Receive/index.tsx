import Navigation from "../../../components/Navigation";
import { useAbstraxionAccount } from "@burnt-labs/abstraxion";
import { QRCodeSVG } from "qrcode.react"; // Change to this
import MindGameLogo from "../../../assets/mind-games-logo.png";

export const Receive = () => {
  const {
    data: { bech32Address },
  } = useAbstraxionAccount();

  return (
    <div className="flex flex-col min-h-screen w-full bg-gradient-to-b from-[#160f28] to-black">
      <Navigation />
      <div className="flex flex-col items-center justify-center flex-1 px-4">
        <h1 className="text-3xl font-bold text-white mb-8">Receive</h1>

        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 flex flex-col items-center max-w-md w-full">
          <div className="bg-white p-4 rounded-xl mb-6">
            <QRCodeSVG
              imageSettings={{
                src: MindGameLogo,
                height: 32,
                width: 32,
                excavate: false,
              }}
              value={bech32Address}
              size={256}
            />
          </div>

          <div className="w-full">
            <p className="text-gray-400 text-sm mb-2">Account Address</p>
            <p className="text-white break-all bg-white/5 p-4 rounded-lg font-mono text-sm">
              {bech32Address}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
