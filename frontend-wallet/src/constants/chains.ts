export interface ChainConfig {
  rpcEndpoint: string;
  denom: string;
  displayDenom: string;
  logo: string;
  chainName: string;
  decimals: number;
  prefix: string;
  gasPrice: string;
}

import CoreumLogo from "../assets/coreum-logo.png";

export const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  XION: {
    rpcEndpoint: "https://rpc.xion-testnet-1.burnt.com:443",
    denom: "uxion",
    displayDenom: "XION",
    logo: "/assets/xion-logo.png",
    chainName: "Xion",
    decimals: 6,
    prefix: "xion",
    gasPrice: '0.025'

  },
  OSMOSIS: {
    rpcEndpoint: "https://rpc.osmosis.zone",
    denom: "uosmo",
    displayDenom: "OSMO",
    logo: "/assets/osmosis-logo.png",
    chainName: "Osmosis",
    decimals: 6,
    prefix: "osmo",
    gasPrice: '0.025',

  },
  COSMOS: {
    rpcEndpoint: "https://rpc.cosmos.network",
    denom: "uatom",
    displayDenom: "ATOM",
    logo: CoreumLogo,
    chainName: "Cosmos Hub",
    decimals: 6,
    prefix: "cosmos",
    gasPrice: '0.025',

  },
  COREUM: {
    rpcEndpoint: "https://full-node.testnet-1.coreum.dev:26657",
    denom: "utestcore",
    displayDenom: "CORE",
    logo: "../assets/coreum-logo.png",
    chainName: "Coreum",
    decimals: 6,
      prefix: "testcore",
        gasPrice: '0.025',

  }
};

// Helper function to get config by prefix
export const getChainConfigByPrefix = (prefix: string): ChainConfig | undefined => {
  return Object.values(CHAIN_CONFIGS).find(config => config.prefix === prefix);
};

// Helper function to get config by denom
export const getChainConfigByDenom = (denom: string): ChainConfig | undefined => {
  return Object.values(CHAIN_CONFIGS).find(config => config.denom === denom);
};

// Export chain names for easy access
export const CHAIN_NAMES = Object.fromEntries(
  Object.entries(CHAIN_CONFIGS).map(([key, config]) => [key, config.chainName])
);

// Export prefixes for easy access
export const CHAIN_PREFIXES = Object.fromEntries(
  Object.entries(CHAIN_CONFIGS).map(([key, config]) => [key, config.prefix])
); 
