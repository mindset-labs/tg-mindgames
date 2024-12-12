import {
  useAbstraxionAccount,
  useAbstraxionSigningClient,
} from "@burnt-labs/abstraxion";
import Navigation from "../../components/Navigation";
import { useState, useEffect } from "react";
import { TREASURY, CONTRACTS } from "../../constants/contracts";

export const Test = () => {
  //Counter contract address
  const { client } = useAbstraxionSigningClient();
  const { data: account } = useAbstraxionAccount();
  const cw_counter_address = CONTRACTS.counterContract;
  const [incrementResult, setIncrementResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [counterValue, setCounterValue] = useState<number | null>(null);

  const generateCoreumAddress = async () => {
    const address = await client?.getAccount("Osmosis");
    console.log("Osmosis Address:", address);
  };

  client?.sendTokens;

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
    }
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-gradient-to-b from-[#160f28] to-black">
      <div className="flex-1 px-4 py-8 max-w-7xl mx-auto w-full">
        <h1 className="text-4xl font-bold text-white mb-8">Settings</h1>

        <div className="bg-[#1F1830] rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Counter Management
          </h2>

          <div className="mb-4 text-white">
            Current Count: {counterValue !== null ? counterValue : "Loading..."}
          </div>

          <button
            onClick={incrementCounter}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Increment Counter
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-600 text-white rounded-lg">
              {error}
            </div>
          )}

          {incrementResult && (
            <div className="mt-4 p-4 bg-[#2A223F] rounded-lg overflow-x-auto">
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
      </div>
      <Navigation />
    </div>
  );
};
