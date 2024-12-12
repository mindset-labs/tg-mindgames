import {
  useAbstraxionAccount,
  useAbstraxionSigningClient,
} from "@burnt-labs/abstraxion";
import Navigation from "../../components/Navigation";
import { useState, useEffect } from "react";
import { TREASURY, CONTRACTS } from "../../constants/contracts";
import MindGameLogo from "../../assets/mind-games-logo.png";

export const Test = () => {
  //Counter contract address
  const { client } = useAbstraxionSigningClient();
  const { data: account } = useAbstraxionAccount();
  const cw_counter_address = CONTRACTS.counterContract;
  const [incrementResult, setIncrementResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [counterValue, setCounterValue] = useState<number | null>(null);
  const [isIncrementing, setIsIncrementing] = useState(false);

  const generateCoreumAddress = async () => {
    const address = await client?.getAccount("Osmosis");
    console.log("Osmosis Address:", address);
  };

  useEffect(() => {
    generateCoreumAddress();
  }, []);

  const queryCounter = async () => {
    try {
      const queryMsg = { get_count: {} };
      const result = await client?.queryContractSmart(
        cw_counter_address,
        queryMsg
      );
      console.log("Query result:", result);
      setCounterValue(result);
      setError(null);
    } catch (error) {
      console.error("Query error:", error);
      setError(error.message || "Failed to query counter");
    }
  };

  // Add client dependency to useEffect
  useEffect(() => {
    if (client && cw_counter_address) {
      console.log("Querying counter...");
      queryCounter();
    }
  }, [client, cw_counter_address]);

  // Separate useEffect for increment updates
  useEffect(() => {
    if (incrementResult) {
      console.log("Increment detected, querying counter...");
      queryCounter();
    }
  }, [incrementResult]);

  async function incrementCounter() {
    setIsIncrementing(true);
    const msg = {
      increment: {},
    };

    try {
      const increment = await client?.execute(
        account?.bech32Address,
        cw_counter_address,
        msg,
        {
          amount: [{ amount: "1", denom: "uxion" }],
          gas: "500000",
          granter: TREASURY.treasury,
        },
        "", // memo
        []
      );
      console.log("Increment successful:", increment);
      setIncrementResult(increment);
      setError(null);
    } catch (error) {
      console.error(error);
      setError(error.message || "An error occurred");
    } finally {
      setIsIncrementing(false);
    }
  }

  return (
    <div className="pb-24 flex flex-col h-screen w-full bg-gradient-to-br from-[#160f28] via-[#1a1339] to-black animate-gradient">
      <main className="flex-1 container mx-auto px-4 py-8 mt-3 overflow-y-auto h-[calc(100vh-64px)] max-w-7xl">
        <div className="flex items-center justify-center gap-4 mb-8 whitespace-nowrap">
          <img
            src={MindGameLogo}
            alt="Mind Game"
            className="w-12 h-12 rounded-md"
          />
          <h1 className="text-4xl font-bold text-white inline-flex items-center">
            Counter Testing
          </h1>
        </div>

        <div className="bg-[#1f1635]/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-purple-500/10 hover:border-purple-500/20 transition-all max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-6">
            Counter Management
          </h2>

          <div className="mb-6 p-4 bg-[#160f28]/50 rounded-lg">
            <span className="text-gray-300">Current Count:</span>
            <span className="text-white font-bold ml-2">
              {counterValue !== null ? counterValue : "Loading..."}
            </span>
          </div>

          <button
            onClick={incrementCounter}
            disabled={isIncrementing}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 
                     text-white py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-purple-500/20
                     border border-purple-400/30 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isIncrementing ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              "Increment Counter"
            )}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg">
              {error}
            </div>
          )}

          {incrementResult && (
            <div className="mt-4 p-4 bg-[#160f28]/50 rounded-lg overflow-x-auto border border-purple-500/10">
              <pre className="text-gray-300 text-sm">
                {JSON.stringify(
                  incrementResult,
                  (_, value) =>
                    typeof value === "bigint" ? value.toString() : value,
                  2
                )}
              </pre>
            </div>
          )}
        </div>
      </main>
      <Navigation />
    </div>
  );
};
