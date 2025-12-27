import { useState, useCallback } from 'react';
import { ethers } from 'ethers';

// Contract configuration
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';

// Sepolia chain configuration for fhEVM
const SEPOLIA_CHAIN_ID = 11155111;

// Demo mode flag - always true on Sepolia (FHE only works on Zama network)
const DEMO_MODE = true;

export function useFhevm() {
  const [isInitialized, setIsInitialized] = useState(DEMO_MODE);
  const [fhevmInstance, setFhevmInstance] = useState<any>(null);

  const initialize = useCallback(async () => {
    if (DEMO_MODE) {
      console.log('Running in demo mode - FHE disabled');
      setIsInitialized(true);
      return;
    }

    try {
      // Dynamic import of relayer SDK - only when contract is deployed
      const relayerModule = await import('@zama-fhe/relayer-sdk');
      const createFhevmInstance = relayerModule.createFhevmInstance || relayerModule.default?.createFhevmInstance;

      if (!createFhevmInstance) {
        throw new Error('createFhevmInstance not found in relayer SDK');
      }

      if (!window.ethereum) {
        throw new Error('No ethereum provider found');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();

      if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
        console.warn('Not on Sepolia network, FHE features may not work');
      }

      // Initialize fhEVM instance
      const instance = await createFhevmInstance({
        chainId: SEPOLIA_CHAIN_ID,
      });

      setFhevmInstance(instance);
      setIsInitialized(true);

      console.log('fhEVM initialized successfully');
    } catch (error) {
      console.error('Failed to initialize fhEVM:', error);
      // Fall back to demo mode
      setIsInitialized(true);
    }
  }, []);

  const encryptAmount = useCallback(
    async (amount: bigint, contractAddress: string, userAddress: string) => {
      if (DEMO_MODE || !fhevmInstance) {
        // Demo mode: return mock encrypted data
        console.log('Demo mode: simulating encryption for amount:', amount.toString());
        return {
          encryptedAmount: '0x' + amount.toString(16).padStart(64, '0'),
          inputProof: '0x' + '00'.repeat(32),
        };
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
      if (DEMO_MODE || !fhevmInstance) {
        // Demo mode: return mock decrypted value
        console.log('Demo mode: simulating decryption');
        return BigInt('1000000000000000000'); // 1 token
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
    isDemoMode: DEMO_MODE,
  };
}
