import { useState, useCallback } from 'react';
import { ethers } from 'ethers';

// Contract configuration
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';

// Zama fhEVM chain configuration
const ZAMA_CHAIN_ID = 8009;

export function useFhevm() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [fhevmInstance, setFhevmInstance] = useState<any>(null);

  const initialize = useCallback(async () => {
    try {
      // Dynamic import of relayer SDK
      const { createFhevmInstance } = await import('@zama-fhe/relayer-sdk');

      if (!window.ethereum) {
        throw new Error('No ethereum provider found');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();

      if (Number(network.chainId) !== ZAMA_CHAIN_ID) {
        console.warn('Not on Zama network, FHE features may not work');
      }

      // Initialize fhEVM instance
      const instance = await createFhevmInstance({
        chainId: ZAMA_CHAIN_ID,
      });

      setFhevmInstance(instance);
      setIsInitialized(true);

      console.log('fhEVM initialized successfully');
    } catch (error) {
      console.error('Failed to initialize fhEVM:', error);
      setIsInitialized(false);
    }
  }, []);

  const encryptAmount = useCallback(
    async (amount: bigint, contractAddress: string, userAddress: string) => {
      if (!fhevmInstance) {
        throw new Error('fhEVM not initialized');
      }

      try {
        // Create encrypted input
        const input = fhevmInstance.createEncryptedInput(contractAddress, userAddress);
        input.add64(amount);
        const encryptedData = input.encrypt();

        return {
          encryptedAmount: encryptedData.handles[0],
          inputProof: encryptedData.inputProof,
        };
      } catch (error) {
        console.error('Encryption failed:', error);
        throw error;
      }
    },
    [fhevmInstance]
  );

  const decryptAmount = useCallback(
    async (encryptedHandle: string, contractAddress: string) => {
      if (!fhevmInstance) {
        throw new Error('fhEVM not initialized');
      }

      try {
        // Request decryption through relayer
        const decrypted = await fhevmInstance.decrypt(contractAddress, encryptedHandle);
        return decrypted;
      } catch (error) {
        console.error('Decryption failed:', error);
        throw error;
      }
    },
    [fhevmInstance]
  );

  return {
    isInitialized,
    fhevmInstance,
    initialize,
    encryptAmount,
    decryptAmount,
  };
}
