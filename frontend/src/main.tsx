import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AbstraxionProvider } from "@burnt-labs/abstraxion";
import { TREASURY, CONTRACTS } from "./constants/contracts";

const config = {
  treasury: TREASURY.treasury,
  contracts: [CONTRACTS.counterContract],
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AbstraxionProvider config={config}>
      <App />
    </AbstraxionProvider>
  </StrictMode>
);
