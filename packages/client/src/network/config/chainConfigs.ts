import { MUDChain, latticeTestnet, mudFoundry } from "@latticexyz/common/chains";

export const dev = {
  ...mudFoundry,
  //COMMENT OUT INDEXER URL TO USE ONLY RPC
  indexerUrl: "http://localhost:3001",
};

export const caldera = {
  name: "Caldera",
  id: 12523,
  network: "caldera",
  nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
  rpcUrls: {
    default: {
      http: ["https://primodium-bedrock.calderachain.xyz/replica-http"],
      // webSocket: ["wss://primodium-bedrock.calderachain.xyz/replica-ws"],
    },
    public: {
      http: ["https://primodium-bedrock.calderachain.xyz/replica-http"],
      // webSocket: ["wss://primodium-bedrock.calderachain.xyz/replica-ws"],
    },
  },
  faucetUrl: "https://caldera-faucet.primodium.ai/trpc",
  indexerUrl: "https://caldera-mud2-indexer.primodium.ai/trpc",
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://primodium-bedrock.calderaexplorer.xyz/",
    },
  },
};

export const calderaSepolia = {
  name: "Caldera Sepolia",
  id: 10017,
  network: "calderaSepolia",
  nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
  rpcUrls: {
    default: {
      http: ["https://primodium-sepolia.rpc.caldera.xyz/http"],
    },
    public: {
      http: ["https://primodium-sepolia.rpc.caldera.xyz/http"],
    },
  },
  faucetUrl: "https://caldera-sepolia-faucet.primodium.ai/trpc",
  indexerUrl: "https://caldera-sepolia-indexer.primodium.ai",
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://primodium-sepolia.explorer.caldera.xyz/",
    },
  },
};

interface ChainConfigs {
  [x: string]: MUDChain & { indexerUrl?: string };
}

export const chainConfigs: ChainConfigs = {
  latticeTestnet,
  caldera,
  calderaSepolia,
  dev,
};
