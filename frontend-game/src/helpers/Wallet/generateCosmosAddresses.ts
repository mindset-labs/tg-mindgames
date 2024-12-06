import  {bech32} from 'bech32';

export const generateCosmosAddress = (xionAddress: string, prefix: string): string => {
  try {
    // Decode the Xion address to get the public key bytes
    const decoded = bech32.decode(xionAddress);
    const words = decoded.words;
    
    // Encode with new prefix for different Cosmos chains
    return bech32.encode(prefix, words);
  } catch (error) {
    console.error('Error generating Cosmos address:', error);
    return '';
  }
};

// Usage example:
// Prefixes for different Cosmos chains
export const COSMOS_PREFIXES = {
  XION: 'xion',
  OSMOSIS: 'osmo',
  COSMOS_HUB: 'cosmos',
  JUNO: 'juno',
  STARGAZE: "stars",
  CORE: "testcore",
  // Add more as needed
} as const;
