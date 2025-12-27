import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';

// Contract configuration
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';

// Sepolia chain configuration for fhEVM
const SEPOLIA_CHAIN_ID = 11155111;

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
        console.log('Initializing fhEVM...');

        // Dynamic import of fhevmjs
        const fhevm = await import('fhevmjs');

        if (!window.ethereum) {
          throw new Error('No ethereum provider found. Please install MetaMask.');
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();

        if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
          console.warn('Not on Sepolia network. Please switch to Sepolia.');
        }

        // Initialize fhEVM
        await fhevm.initFhevm();

        // Create instance for Sepolia
        const instance = await fhevm.createInstance({
          chainId: SEPOLIA_CHAIN_ID,
          networkUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
        });

        globalFhevmInstance = instance;
        console.log('fhEVM initialized successfully!');
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
