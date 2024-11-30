import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AbstraxionProvider } from "@burnt-labs/abstraxion";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AbstraxionProvider
      config={{
        contracts: [
          "xion1z70cvc08qv5764zeg3dykcyymj5z6nu4sqr7x8vl4zjef2gyp69s9mmdka",
        ],
      }}
    >
      <App />
    </AbstraxionProvider>
  </StrictMode>
);
