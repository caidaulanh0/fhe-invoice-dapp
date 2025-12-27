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

declare module '@zama-fhe/relayer-sdk/web' {
  export interface SepoliaConfigType {
    chainId: number;
    kmsContractAddress: string;
    aclContractAddress: string;
    inputVerifierContractAddress: string;
    verifyingContractAddressDecryption: string;
    verifyingContractAddressInputVerification: string;
    network: string;
    relayerUrl: string;
    gatewayChainId: number;
  }

  export interface FhevmInstance {
    createEncryptedInput(contractAddress: string, userAddress: string): {
      add64(value: bigint): void;
      encrypt(): Promise<{ handles: string[]; inputProof: string }>;
    };
    publicDecrypt(handles: string[]): Promise<bigint[]>;
  }

  export const SepoliaConfig: SepoliaConfigType;
  export function initSDK(): Promise<void>;
  export function createInstance(config: SepoliaConfigType): Promise<FhevmInstance>;
}
