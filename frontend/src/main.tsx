import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AbstraxionProvider } from "@burnt-labs/abstraxion";
import { TREASURY, CONTRACTS } from "./constants/contracts";
import { createConfig, AbstractProvider } from "@abstract-money/react";
import { xionProvider } from "@abstract-money/provider-xion";

const abstractConfig = createConfig({
  apiUrl: "https://xion.api.abstract.money/graphql",
  provider: xionProvider,
});

const config = {
  treasury: TREASURY.treasury,
  contracts: [CONTRACTS.counterContract],
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AbstraxionProvider config={config}>
      <AbstractProvider config={abstractConfig}>
        <App />
      </AbstractProvider>
    </AbstraxionProvider>
  </StrictMode>
);
