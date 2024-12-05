import { useState, useEffect } from "react";
import { useSwipeable } from "react-swipeable";
import Navigation from "../../../components/Navigation";
import {
  useAbstraxionAccount,
  useAbstraxionSigningClient,
} from "@burnt-labs/abstraxion";
import XionLogo from "../../../assets/xion-logo.png";
import CosmosLogo from "../../../assets/cosmos-logo.png";
import OsmosisLogo from "../../../assets/osmosis-logo.png";
import CoreumLogo from "../../../assets/coreum-logo.png";
import {
  generateCosmosAddress,
  COSMOS_PREFIXES,
} from "../../../helpers/Wallet/generateCosmosAddresses";

import { AbstraxionProvider } from "@burnt-labs/abstraxion";
import { DirectSignResponse, makeSignBytes } from "@cosmjs/proto-signing";
import { SignDoc } from "cosmjs-types/cosmos/tx/v1beta1/tx";

import {
  AADirectSigner,
  AAccountData,
  AAClient,
  AAAlgo,
  AADefaultSigner,
} from "@burnt-labs/signers";

import {
  SigningCosmWasmClient,
  OfflineDirectSigner,
} from "@cosmjs/cosmwasm-stargate";

import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";

import { SignArbSecp256k1HdWallet } from "@burnt-labs/abstraxion-core";

export const Send = () => {
  const { client } = useAbstraxionSigningClient();

  const {
    data: { bech32Address },
  } = useAbstraxionAccount();

  // Chain configurations (same as Receive)
  const chainOrder = ["xion", "cosmos", "osmosis", "coreum"];
  const [selectedChain, setSelectedChain] = useState("xion");
  const [rpcUrl, setRpcUrl] = useState("https://default-rpc-url.com");

  const chainLogos = {
    xion: XionLogo,
    cosmos: CosmosLogo,
    osmosis: OsmosisLogo,
    coreum: CoreumLogo,
  };

  const chainNames = {
    xion: "Xion",
    cosmos: "Cosmos Hub",
    osmosis: "Osmosis",
    coreum: "Coreum",
  };

  const chainBackgrounds = {
    xion: "bg-gradient-to-b from-[#160f28] to-black",
    cosmos: "bg-gradient-to-b from-[#2a2a72] to-[#009ffd]",
    osmosis: "bg-gradient-to-b from-[#1e3c72] to-[#2a5298]",
    coreum: "bg-gradient-to-b from-[#ff7e5f] to-[#feb47b]",
  };

  // Swipe handlers (same logic as Receive)
  const handleSwipe = (direction: string) => {
    const currentIndex = chainOrder.indexOf(selectedChain);
    let newIndex = currentIndex;

    if (direction === "LEFT") {
      newIndex = (currentIndex + 1) % chainOrder.length;
    } else if (direction === "RIGHT") {
      newIndex = (currentIndex - 1 + chainOrder.length) % chainOrder.length;
    }

    setSelectedChain(chainOrder[newIndex]);
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleSwipe("LEFT"),
    onSwipedRight: () => handleSwipe("RIGHT"),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
  });

  // Add new state variables
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState("XION");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Token configurations with chain info
  const tokenConfigs = {
    XION: {
      denom: "uxion",
      decimals: 6,
      chains: ["xion"],
    },
    ATOM: {
      denom: "uatom",
      decimals: 6,
      chains: ["cosmos", "osmosis"], // Can be sent on these chains
    },
    OSMO: {
      denom: "uosmo",
      decimals: 6,
      chains: ["osmosis", "cosmos"],
    },
    CORE: {
      denom: "ucore",
      decimals: 6,
      chains: ["coreum"],
    },
  };

  // Add state for receiving chain
  const [receivingChain, setReceivingChain] = useState("");

  // Add function to get generated address for current chain
  const getChainAddress = (chain: string): string => {
    if (!bech32Address) return "";

    switch (chain) {
      case "xion":
        return bech32Address;
      case "cosmos":
        return generateCosmosAddress(bech32Address, COSMOS_PREFIXES.COSMOS_HUB);
      case "osmosis":
        return generateCosmosAddress(bech32Address, COSMOS_PREFIXES.OSMOSIS);
      case "coreum":
        return generateCosmosAddress(bech32Address, "testcore"); // Add COREUM to your COSMOS_PREFIXES if needed
      default:
        return "";
    }
  };

  // Add function to sign for other chains
  const signForOtherChain = async (chainId: string, message: string) => {
    try {
      if (!client) return;

      // Cast the client to AADirectSigner
      const signer = client as AADirectSigner;

      const signDoc: SignDoc = {
        bodyBytes: new TextEncoder().encode(message),
        authInfoBytes: new Uint8Array(),
        chainId: chainId,
        accountNumber: 0, // You'll need the correct account number
      };

      const signature = await signer.signDirect(bech32Address, signDoc);
      console.log("Signature:", signature);
      return signature;
    } catch (error) {
      console.error("Error signing message:", error);
      throw error;
    }
  };

  // Modify handleSend to use cross-chain signing
  const handleSend = async () => {
    try {
      setIsLoading(true);
      setError("");

      if (!client) return;

      const microAmount = (parseFloat(amount) * Math.pow(10, 6)).toString();

      // Create the message for Coreum
      const msg = {
        typeUrl: "/cosmos.bank.v1beta1.MsgSend",
        value: {
          fromAddress: getChainAddress("coreum"),
          toAddress: recipientAddress,
          amount: [
            {
              denom: "utestcore",
              amount: microAmount,
            },
          ],
        },
      };

      // Sign the message using Coreum's chain ID
      const signature = await signForOtherChain(
        "coreum-testnet-1",
        JSON.stringify(msg)
      );

      // TODO: We'll need to broadcast this signed transaction to Coreum's network
      // This will require setting up a separate client or connection to Coreum's RPC

      console.log("Transaction successful:", result);
      setAmount("");
      setRecipientAddress("");
    } catch (error) {
      console.error("Error during transaction:", error);
      setError("Transaction failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Update the rpcUrl based on the selected chain
  useEffect(() => {
    switch (selectedChain) {
      case "xion":
        setRpcUrl("https://xion-rpc-url.com");
        break;
      case "cosmos":
        setRpcUrl("https://cosmos-rpc-url.com");
        break;
      case "osmosis":
        setRpcUrl("https://osmosis-rpc-url.com");
        break;
      case "coreum":
        setRpcUrl("https://full-node.testnet-1.coreum.dev:26657");
        break;
      default:
        setRpcUrl("https://default-rpc-url.com");
    }
  }, [selectedChain]);

  const abstraxionConfig = {
    rpcUrl,
    // ... any other config options you want to keep
  } as const;

  return (
    <AbstraxionProvider config={abstraxionConfig}>
      <div
        {...swipeHandlers}
        className={`flex flex-col min-h-screen w-full ${chainBackgrounds[selectedChain]}`}
      >
        <div className="flex-1 overflow-y-auto pb-32">
          <div className="flex flex-col items-center justify-start px-4 pt-8">
            {/* Chain Selector */}
            <div className="flex items-center gap-2 bg-white/10 rounded-lg p-2 backdrop-blur-lg mb-8">
              <img
                src={chainLogos[selectedChain]}
                alt={chainNames[selectedChain]}
                className="h-6 w-6"
              />
              <select
                value={selectedChain}
                onChange={(e) => setSelectedChain(e.target.value)}
                className="appearance-none bg-transparent text-white border-none focus:outline-none"
              >
                {chainOrder.map((chain) => (
                  <option key={chain} value={chain}>
                    {chainNames[chain]}
                  </option>
                ))}
              </select>
            </div>

            {/* Add Chain Address Display */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 mb-4 w-full max-w-md">
              <div className="text-gray-400 text-sm mb-2">
                Your {chainNames[selectedChain]} Address:
              </div>
              <div className="font-mono text-sm text-white break-all">
                {getChainAddress(selectedChain)}
              </div>
            </div>

            {/* Updated Send Form */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 flex flex-col items-center max-w-md w-full mb-8">
              <div className="w-full space-y-6">
                {/* Token and Chain Selection */}
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">
                    Token and Destination Chain
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedToken}
                      onChange={(e) => {
                        setSelectedToken(e.target.value);
                        // Reset receiving chain when token changes
                        setReceivingChain("");
                      }}
                      className="flex-1 bg-white/5 p-4 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                    >
                      <option value="">Select Token</option>
                      {Object.keys(tokenConfigs).map((token) => (
                        <option key={token} value={token}>
                          {token}
                        </option>
                      ))}
                    </select>

                    <select
                      value={receivingChain}
                      onChange={(e) => setReceivingChain(e.target.value)}
                      disabled={!selectedToken}
                      className="flex-1 bg-white/5 p-4 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                    >
                      <option value="">Select Chain</option>
                      {selectedToken &&
                        tokenConfigs[selectedToken].chains.map((chain) => (
                          <option key={chain} value={chain}>
                            {chainNames[chain]}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-white/5 p-4 rounded-lg font-mono text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                    placeholder="0.0"
                    min="0"
                    step="0.000001"
                  />
                </div>

                {/* Recipient Address */}
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">
                    Recipient Address
                  </label>
                  <input
                    type="text"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    className="w-full bg-white/5 p-4 rounded-lg font-mono text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                    placeholder={
                      receivingChain
                        ? `Enter ${chainNames[receivingChain]} address`
                        : "Select chain first"
                    }
                    disabled={!receivingChain}
                  />
                </div>

                {error && (
                  <div className="text-red-500 text-sm text-center">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleSend}
                  disabled={
                    isLoading ||
                    !amount ||
                    !recipientAddress ||
                    !receivingChain ||
                    !selectedToken
                  }
                  className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Navigation />
    </AbstraxionProvider>
  );
};
