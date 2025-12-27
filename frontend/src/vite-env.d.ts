/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONTRACT_ADDRESS: string;
  readonly VITE_RPC_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '@zama-fhe/relayer-sdk' {
  export function createFhevmInstance(config: { chainId: number }): Promise<any>;
}
