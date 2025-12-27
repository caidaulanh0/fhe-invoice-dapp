import { useState, useCallback, useEffect } from 'react';

// Contract configuration
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';

// Global instance to avoid re-initialization
let globalFhevmInstance: any = null;
let initPromise: Promise<any> | null = null;

export function useFhevm() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [fhevmInstance, setFhevmInstance] = useState<any>(null);
  const [initError, setInitError] = useState<string | null>(null);

  const initialize = useCallback(async () => {
    // If already initialized globally, use that
    if (globalFhevmInstance) {
      setFhevmInstance(globalFhevmInstance);
      setIsInitialized(true);
      return globalFhevmInstance;
    }

    // If initialization is in progress, wait for it
    if (initPromise) {
      const instance = await initPromise;
      setFhevmInstance(instance);
      setIsInitialized(true);
      return instance;
    }

    // Start initialization
    initPromise = (async () => {
      try {
        console.log('Initializing fhEVM with Zama Relayer SDK...');

        // Dynamic import of @zama-fhe/relayer-sdk/web for browser
        const { createInstance, SepoliaConfig } = await import('@zama-fhe/relayer-sdk/web');

        if (!window.ethereum) {
          throw new Error('No ethereum provider found. Please install MetaMask.');
        }

        console.log('Using SepoliaConfig:', SepoliaConfig);

        // Create instance with Sepolia configuration
        const instance = await createInstance(SepoliaConfig);

        globalFhevmInstance = instance;
        console.log('fhEVM initialized successfully with Zama Relayer SDK!');
        return instance;
      } catch (error: any) {
        console.error('Failed to initialize fhEVM:', error);
        initPromise = null; // Allow retry
        throw error;
      }
    })();

    try {
      const instance = await initPromise;
      setFhevmInstance(instance);
      setIsInitialized(true);
      setInitError(null);
      return instance;
    } catch (error: any) {
      setInitError(error.message);
      throw error;
    }
  }, []);

  // Auto-initialize on mount
  useEffect(() => {
    initialize().catch((err) => {
      console.error('Auto-init failed:', err);
    });
  }, [initialize]);

  const encryptAmount = useCallback(
    async (amount: bigint, contractAddress: string, userAddress: string) => {
      // Ensure we have an instance
      let instance = fhevmInstance;
      if (!instance) {
        console.log('FHE not ready, initializing...');
        instance = await initialize();
      }

      if (!instance) {
        throw new Error('FHE encryption not available. Please refresh the page.');
      }

      try {
        console.log('Encrypting amount:', amount.toString());
        console.log('Contract:', contractAddress);
        console.log('User:', userAddress);

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
    [fhevmInstance, initialize]
  );

  const decryptAmount = useCallback(
    async (encryptedHandle: string, _contractAddress: string) => {
      let instance = fhevmInstance;
      if (!instance) {
        instance = await initialize();
      }

      if (!instance) {
        throw new Error('FHE decryption not available');
      }

      try {
        const decrypted = await instance.decrypt(encryptedHandle);
        return decrypted;
      } catch (error) {
        console.error('Decryption failed:', error);
        throw error;
      }
    },
    [fhevmInstance, initialize]
  );

  return {
    isInitialized,
    fhevmInstance,
    initError,
    initialize,
    encryptAmount,
    decryptAmount,
  };
}
