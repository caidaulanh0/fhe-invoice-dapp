/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONTRACT_ADDRESS: string;
  readonly VITE_RPC_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'fhevmjs' {
  export function initFhevm(): Promise<void>;
  export function createInstance(config: { chainId: number; networkUrl?: string }): Promise<any>;
}
