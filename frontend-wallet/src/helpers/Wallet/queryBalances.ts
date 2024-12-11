import { QueryClient, createProtobufRpcClient } from "@cosmjs/stargate";
import { Tendermint34Client } from "@cosmjs/tendermint-rpc";
import { QueryClientImpl } from "cosmjs-types/cosmos/bank/v1beta1/query";
import { ChainConfig, CHAIN_CONFIGS } from "../../constants/chains";
import { pubkeyToAddress } from '@cosmjs/amino';
import { generateCosmosAddress } from './generateCosmosAddresses';

export interface TokenBalance {
  denom: string;
  amount: string;
  displayAmount: string;
  chainInfo: ChainConfig;
}

function generateAddressesFromXionAddress(xionAddress: string): Record<string, string> {
  const addressMap: Record<string, string> = {};
  
  Object.values(CHAIN_CONFIGS).forEach(config => {
    const address = generateCosmosAddress(xionAddress, config.prefix);
    if (address) {
      addressMap[config.prefix] = address;
    }
  });
  
  return addressMap;
}

export async function queryChainBalance(address: string, chainConfig: ChainConfig): Promise<TokenBalance | null> {
  try {
    const tmClient = await Tendermint34Client.connect(chainConfig.rpcEndpoint);
    const queryClient = new QueryClient(tmClient);
    const rpcClient = createProtobufRpcClient(queryClient);
    const bankQueryClient = new QueryClientImpl(rpcClient);

    const { balances } = await bankQueryClient.AllBalances({ address });
    const tokenBalance = balances.find(b => b.denom === chainConfig.denom);

    if (!tokenBalance) return null;

    const displayAmount = (Number(tokenBalance.amount) / Math.pow(10, chainConfig.decimals)).toString();

    return {
      denom: tokenBalance.denom,
      amount: tokenBalance.amount,
      displayAmount,
      chainInfo: chainConfig
    };
  } catch (error) {
    console.error(`Error querying ${chainConfig.chainName} balance:`, error);
    return null;
  }
}

export async function queryAllChainBalances(xionAddress: string): Promise<TokenBalance[]> {
  const addressMap = generateAddressesFromXionAddress(xionAddress);
  
  const balancePromises = Object.values(CHAIN_CONFIGS).map(config => {
    const chainAddress = addressMap[config.prefix];
    if (!chainAddress) {
      console.warn(`Failed to generate address for chain ${config.prefix}`);
      return null;
    }
    return queryChainBalance(chainAddress, config);
  });

  const balances = await Promise.all(balancePromises);
  return balances.filter((balance): balance is TokenBalance => balance !== null);
} 
