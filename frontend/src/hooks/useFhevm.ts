import { useState, useEffect, useCallback } from 'react';
import { initSDK, createInstance, SepoliaConfig, FhevmInstance } from '@zama-fhe/relayer-sdk/web';

// Contract configuration
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';

// Global instance to avoid re-initialization
let fhevmInstance: FhevmInstance | null = null;
let initPromise: Promise<FhevmInstance> | null = null;

export function useFhevm() {
  const [instance, setInstance] = useState<FhevmInstance | null>(fhevmInstance);
  const [isInitialized, setIsInitialized] = useState(!!fhevmInstance);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      if (fhevmInstance) {
        setInstance(fhevmInstance);
        setIsInitialized(true);
        return;
      }

      if (initPromise) {
        try {
          const inst = await initPromise;
          setInstance(inst);
          setIsInitialized(true);
        } catch (err: any) {
          setInitError(err.message || 'Failed to initialize FHEVM SDK');
          console.error('Init promise failed:', err);
        }
        return;
      }

      try {
        console.log('Initializing FHEVM SDK...');

        initPromise = (async () => {
          // Initialize the SDK (WASM modules) - THIS IS REQUIRED!
          await initSDK();
          console.log('SDK initialized, creating instance...');

          // Create instance with Sepolia config
          const inst = await createInstance(SepoliaConfig);
          fhevmInstance = inst;
          console.log('FHEVM instance created successfully!');
          return inst;
        })();

        const inst = await initPromise;
        setInstance(inst);
        setIsInitialized(true);
      } catch (err: any) {
        setInitError(err.message || 'Failed to initialize FHEVM SDK');
        console.error('FHEVM init failed:', err);
        initPromise = null; // Allow retry
      }
    };

    init();
  }, []);

  const encryptAmount = useCallback(
    async (amount: bigint, contractAddress: string, userAddress: string) => {
      if (!instance) {
        throw new Error('FHEVM SDK not initialized. Please wait...');
      }

      try {
        console.log('Encrypting amount:', amount.toString());

        // Create encrypted input
        const input = instance.createEncryptedInput(contractAddress, userAddress);
        input.add64(amount);
        const encryptedData = await input.encrypt();

        console.log('Encryption successful:', {
          handle: encryptedData.handles[0],
          proofLength: encryptedData.inputProof.length
        });

        return {
          encryptedAmount: encryptedData.handles[0],
          inputProof: encryptedData.inputProof,
        };
      } catch (error) {
        console.error('Encryption failed:', error);
        throw error;
      }
    },
    [instance]
  );

  const decryptAmount = useCallback(
    async (encryptedHandle: string, _contractAddress: string) => {
      if (!instance) {
        throw new Error('FHEVM SDK not initialized');
      }

      try {
        const decrypted = await instance.publicDecrypt([encryptedHandle]);
        return decrypted[0];
      } catch (error) {
        console.error('Decryption failed:', error);
        throw error;
      }
    },
    [instance]
  );

  return {
    isInitialized,
    fhevmInstance: instance,
    initError,
    encryptAmount,
    decryptAmount,
  };
}
