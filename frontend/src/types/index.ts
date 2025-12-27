export interface Invoice {
  id: bigint;
  sender: string;
  recipient: string;
  description: string;
  status: InvoiceStatus;
  createdAt: bigint;
  updatedAt: bigint;
  encryptedAmount?: string;
  decryptedAmount?: bigint;
}

export enum InvoiceStatus {
  Pending = 0,
  Paid = 1,
  Cancelled = 2,
}

export interface WalletState {
  account: string | null;
  chainId: number | null;
  isConnecting: boolean;
  isZamaNetwork: boolean;
}

export interface FhevmState {
  isInitialized: boolean;
  instance: any;
}

export interface EncryptedInput {
  encryptedAmount: string;
  inputProof: string;
}
