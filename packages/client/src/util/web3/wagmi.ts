import { Buffer } from "buffer";
import { getNetworkConfig } from "src/network/config/getNetworkConfig";
import { configureChains, createConfig } from "wagmi";
import { CoinbaseWalletConnector } from "wagmi/connectors/coinbaseWallet";
import { InjectedConnector } from "wagmi/connectors/injected";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import { WalletConnectConnector } from "wagmi/connectors/walletConnect";
import { publicProvider } from "wagmi/providers/public";

// polyfill Buffer for client
if (!window.Buffer) {
  window.Buffer = Buffer;
}

const env = import.meta.env;
const projectId = env.PRI_WALLETCONNECT_PROJECT_ID;

const chain = getNetworkConfig().chain;
const { chains, publicClient, webSocketPublicClient } = configureChains([chain], [publicProvider()]);

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains }),
    new WalletConnectConnector({
      chains,
      options: {
        projectId,
      },
    }),
    new CoinbaseWalletConnector({
      chains,
      options: {
        appName: "wagmi",
      },
    }),
    new InjectedConnector({
      chains,
      options: {
        name: "Injected",
        shimDisconnect: true,
      },
    }),
  ],
  publicClient,
  webSocketPublicClient,
});
