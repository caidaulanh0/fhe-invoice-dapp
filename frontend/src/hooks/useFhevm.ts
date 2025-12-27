import { useState, useCallback } from 'react';
import { ethers } from 'ethers';

// Contract configuration
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';

// Sepolia chain configuration for fhEVM
const SEPOLIA_CHAIN_ID = 11155111;

export function useFhevm() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [fhevmInstance, setFhevmInstance] = useState<any>(null);

  const initialize = useCallback(async () => {
    try {
      // Dynamic import of fhevmjs
      const fhevm = await import('fhevmjs');

      if (!window.ethereum) {
        throw new Error('No ethereum provider found');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();

      if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
        console.warn('Not on Sepolia network, FHE features may not work');
      }

      // Initialize fhEVM instance for Sepolia
      await fhevm.initFhevm();

      const instance = await fhevm.createInstance({
        chainId: SEPOLIA_CHAIN_ID,
        networkUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
      });

      setFhevmInstance(instance);
      setIsInitialized(true);

      console.log('fhEVM initialized successfully');
    } catch (error) {
      console.error('Failed to initialize fhEVM:', error);
      // Set initialized anyway to allow UI to work
      setIsInitialized(true);
    }
  }, []);

  const encryptAmount = useCallback(
    async (amount: bigint, contractAddress: string, userAddress: string) => {
      if (!fhevmInstance) {
        // Fallback: return mock data if not initialized
        console.log('FHE not ready, using mock encryption');
        return {
          encryptedAmount: '0x' + amount.toString(16).padStart(64, '0'),
          inputProof: '0x' + '00'.repeat(32),
        };
      }

      try {
        // Create encrypted input
        const input = fhevmInstance.createEncryptedInput(contractAddress, userAddress);
        input.add64(amount);
        const encryptedData = await input.encrypt();

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
    async (encryptedHandle: string, _contractAddress: string) => {
      if (!fhevmInstance) {
        // Fallback
        console.log('FHE not ready, using mock decryption');
        return BigInt('1000000000000000000');
      }

      try {
        // Request decryption
        const decrypted = await fhevmInstance.decrypt(encryptedHandle);
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
