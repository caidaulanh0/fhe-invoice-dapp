// Network Configuration
export const ZAMA_CHAIN_ID = 8009;
export const SEPOLIA_CHAIN_ID = 11155111;

export const ZAMA_NETWORK = {
  chainId: `0x${ZAMA_CHAIN_ID.toString(16)}`,
  chainName: 'Zama Ethereum',
  nativeCurrency: {
    name: 'ZAMA',
    symbol: 'ZAMA',
    decimals: 18,
  },
  rpcUrls: ['https://ethnode1.zama.fhe.io'],
  blockExplorerUrls: ['https://explorer.zama.ai'],
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
