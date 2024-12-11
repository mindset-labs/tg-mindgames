import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AbstraxionProvider } from "@burnt-labs/abstraxion";
import { TREASURY, CONTRACTS } from "./constants/contracts";
import { createConfig, AbstractProvider } from "@abstract-money/react";
import { xionProvider } from "@abstract-money/provider-xion";
import { store } from "./app/store";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const abstractConfig = createConfig({
  apiUrl: "https://xion.api.abstract.money/graphql",
  provider: xionProvider,
});

const config = {
  treasury: TREASURY.treasury,
  contracts: [
    CONTRACTS.counterContract,
    CONTRACTS.cwCooperationDilemma,
    CONTRACTS.cwLifeCycle,
  ],
};

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AbstraxionProvider config={config}>
          <AbstractProvider config={abstractConfig}>
            <App />
          </AbstractProvider>
        </AbstraxionProvider>
      </QueryClientProvider>
    </Provider>
  </StrictMode>
);
