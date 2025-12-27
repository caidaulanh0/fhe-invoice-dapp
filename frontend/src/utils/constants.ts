// Network Configuration
export const SEPOLIA_CHAIN_ID = 11155111;

export const SEPOLIA_NETWORK = {
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

// Contract addresses - Update after deployment
export const INVOICE_MANAGER_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';

// Status labels
export const STATUS_LABELS = {
  0: 'Pending',
  1: 'Paid',
  2: 'Cancelled',
} as const;

// Format utilities
export const formatAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatAmount = (amount: bigint, decimals = 18): string => {
  return (Number(amount) / Math.pow(10, decimals)).toFixed(6);
};

export const formatDate = (timestamp: bigint): string => {
  return new Date(Number(timestamp) * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
