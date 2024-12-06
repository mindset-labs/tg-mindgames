import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAbstraxionAccount } from "@burnt-labs/abstraxion";

export const useWalletLock = () => {
  const navigate = useNavigate();
  const { isConnected } = useAbstraxionAccount();
 
  useEffect(() => {
    if (!isConnected) {
      navigate("/tg-app/");
    }
  }, [isConnected, navigate]);
};
