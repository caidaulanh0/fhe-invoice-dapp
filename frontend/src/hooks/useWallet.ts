import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    ethereum?: any;
  }
}

// Sepolia Network Configuration
const SEPOLIA_CHAIN_ID = 11155111;
const SEPOLIA_NETWORK = {
  chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}`,
  chainName: 'Sepolia Testnet',
  nativeCurrency: {
    name: 'SepoliaETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://sepolia.infura.io/v3/'],
  blockExplorerUrls: ['https://sepolia.etherscan.io'],
};

export function useWallet() {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const switchToSepoliaNetwork = useCallback(async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_NETWORK.chainId }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [SEPOLIA_NETWORK],
          });
        } catch (addError) {
          console.error('Failed to add Sepolia network:', addError);
          toast.error('Failed to add Sepolia network to wallet');
        }
      } else {
        console.error('Failed to switch network:', switchError);
      }
    }
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      toast.error('Please install MetaMask or another Web3 wallet');
      return;
    }

    setIsConnecting(true);

    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send('eth_requestAccounts', []);

      if (accounts.length === 0) {
        toast.error('No accounts found');
        return;
      }

      const network = await browserProvider.getNetwork();
      const currentChainId = Number(network.chainId);

      if (currentChainId !== SEPOLIA_CHAIN_ID) {
        toast.loading('Switching to Sepolia network...');
        await switchToSepoliaNetwork();
      }

      const walletSigner = await browserProvider.getSigner();

      setProvider(browserProvider);
      setSigner(walletSigner);
      setAccount(accounts[0]);
      setChainId(currentChainId);

      toast.success('Wallet connected!');
    } catch (error: any) {
      console.error('Connection error:', error);
      toast.error(error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  }, [switchToSepoliaNetwork]);

  const disconnect = useCallback(() => {
    setAccount(null);
    setChainId(null);
    setProvider(null);
    setSigner(null);
    toast.success('Wallet disconnected');
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAccount(accounts[0]);
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      setChainId(parseInt(chainIdHex, 16));
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [disconnect]);

  // Auto-connect if previously connected
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            connect();
          }
        } catch (error) {
          console.error('Auto-connect check failed:', error);
        }
      }
    };

    checkConnection();
  }, [connect]);

  return {
    account,
    chainId,
    provider,
    signer,
    isConnecting,
    connect,
    disconnect,
    isSepoliaNetwork: chainId === SEPOLIA_CHAIN_ID,
    switchToSepoliaNetwork,
  };
}
