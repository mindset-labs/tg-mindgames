import { useAbstraxionAccount } from "@burnt-labs/abstraxion";
import { useNavigate } from "react-router-dom";
import WebApp from "@twa-dev/sdk";
import { useEffect, useState } from "react";
import { Loader } from "../../components/Loader";

export const App = () => {
  const navigate = useNavigate();
  const [isFirstTimeOpeningApp, setIsFirstTimeOpeningApp] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
        setIsLoading(false);
      });
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (isConnected) {
        navigate("/tg-app/wallet/home");
      } else if ((!isConnected && !isConnecting) || isFirstTimeOpeningApp) {
        navigate("/tg-app/landing");
      }
    }
  }, [isConnected, isConnecting, isFirstTimeOpeningApp, isLoading]);

  if (isLoading) {
    return <Loader />;
  }

  return null;
};
