import { useAbstraxionAccount } from "@burnt-labs/abstraxion";
import { useNavigate } from "react-router-dom";
import WebApp from "@twa-dev/sdk";
import { useEffect, useState } from "react";

export const App = () => {
  //TODO: Routing to pages
  // If first time opening game
  // If Wallet Created
  // If Wallet not Created
  const navigate = useNavigate();
  const [isFirstTimeOpeningApp, setIsFirstTimeOpeningApp] = useState(false);

  const {
    data: { bech32Address },
    isConnected,
    isConnecting,
  } = useAbstraxionAccount();

  useEffect(() => {
    try {
      WebApp.CloudStorage.getItem("isFirstTimeOpeningApp", (error, result) => {
        if (error) {
          console.error(error);
        }
        console.log(result);
        if (result) {
          setIsFirstTimeOpeningApp(false);
        }
      });
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    console.log({ isConnected, isConnecting });
    //If is connected, navigate to wallet
    if (isConnected) {
      navigate("/tg-app/wallet/home");
    }
    //If is not connected && first time opening the app, navigate to landing page
    else if (!isConnected && !isConnecting && isFirstTimeOpeningApp) {
      navigate("/tg-app/landing");
    } else {
      navigate("/tg-app/landing");
    }
  }, [isConnected, isConnecting, isFirstTimeOpeningApp]);

  return (
    //TODO: Add Loader
    <div>
      <h1>Main App</h1>
      <p onClick={() => navigate("/tg-app/game")}>Go to Game</p>
      <p onClick={() => navigate("/tg-app/wallet/home")}>Go to Wallet</p>
    </div>
  );
};
