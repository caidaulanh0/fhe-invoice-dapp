import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { CONTRACT_ADDRESS } from './useFhevm';

// SimpleInvoice ABI - no FHE encryption needed
const SIMPLE_INVOICE_ABI = [
  'function createInvoice(address recipient, uint256 amount, string calldata description, uint256 dueDate) external returns (uint256)',
  'function payInvoice(uint256 invoiceId) external',
  'function cancelInvoice(uint256 invoiceId) external',
  'function disputeInvoice(uint256 invoiceId) external',
  'function getInvoice(uint256 invoiceId) external view returns (uint256 id, address sender, address recipient, uint256 amount, string memory description, uint8 status, uint256 createdAt, uint256 dueDate)',
  'function getSentInvoices(address user) external view returns (uint256[])',
  'function getReceivedInvoices(address user) external view returns (uint256[])',
  'function getInvoiceCount() external view returns (uint256)',
  'event InvoiceCreated(uint256 indexed invoiceId, address indexed sender, address indexed recipient, uint256 amount, string description, uint256 dueDate)',
  'event InvoicePaid(uint256 indexed invoiceId, address indexed payer)',
  'event InvoiceCancelled(uint256 indexed invoiceId)',
  'event InvoiceDisputed(uint256 indexed invoiceId)',
];

export interface Invoice {
  id: bigint;
  sender: string;
  recipient: string;
  amount: bigint;
  description: string;
  status: number;
  createdAt: bigint;
  dueDate: bigint;
}

export function useContract() {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initContract = async () => {
      if (!window.ethereum || !CONTRACT_ADDRESS) return;

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const invoiceContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          SIMPLE_INVOICE_ABI,
          signer
        );
        setContract(invoiceContract);
      } catch (error) {
        console.error('Failed to initialize contract:', error);
      }
    };

    initContract();
  }, []);

  const createInvoice = useCallback(
    async (
      recipient: string,
      amount: bigint,
      description: string,
      dueDate?: number
    ) => {
      if (!contract) {
        toast.error('Contract not initialized');
        return null;
      }

      setIsLoading(true);
      try {
        const dueDateTimestamp = dueDate || 0; // 0 means contract will use default 30 days

        const tx = await contract.createInvoice(
          recipient,
          amount,
          description,
          dueDateTimestamp
        );
        toast.loading('Creating invoice...', { id: 'create-invoice' });
        const receipt = await tx.wait();
        toast.success('Invoice created!', { id: 'create-invoice' });

        // Parse invoice ID from event
        const event = receipt.logs.find(
          (log: any) => log.fragment?.name === 'InvoiceCreated'
        );
        return event?.args?.invoiceId;
      } catch (error: any) {
        console.error('Create invoice error:', error);
        toast.error(error.reason || 'Failed to create invoice', { id: 'create-invoice' });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [contract]
  );

  const payInvoice = useCallback(
    async (invoiceId: bigint) => {
      if (!contract) {
        toast.error('Contract not initialized');
        return false;
      }

      setIsLoading(true);
      try {
        const tx = await contract.payInvoice(invoiceId);
        toast.loading('Processing payment...', { id: 'pay-invoice' });
        await tx.wait();
        toast.success('Invoice paid!', { id: 'pay-invoice' });
        return true;
      } catch (error: any) {
        console.error('Pay invoice error:', error);
        toast.error(error.reason || 'Failed to pay invoice', { id: 'pay-invoice' });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [contract]
  );

  const cancelInvoice = useCallback(
    async (invoiceId: bigint) => {
      if (!contract) {
        toast.error('Contract not initialized');
        return false;
      }

      setIsLoading(true);
      try {
        const tx = await contract.cancelInvoice(invoiceId);
        toast.loading('Cancelling invoice...', { id: 'cancel-invoice' });
        await tx.wait();
        toast.success('Invoice cancelled!', { id: 'cancel-invoice' });
        return true;
      } catch (error: any) {
        console.error('Cancel invoice error:', error);
        toast.error(error.reason || 'Failed to cancel invoice', { id: 'cancel-invoice' });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [contract]
  );

  const disputeInvoice = useCallback(
    async (invoiceId: bigint) => {
      if (!contract) {
        toast.error('Contract not initialized');
        return false;
      }

      setIsLoading(true);
      try {
        const tx = await contract.disputeInvoice(invoiceId);
        toast.loading('Disputing invoice...', { id: 'dispute-invoice' });
        await tx.wait();
        toast.success('Invoice disputed!', { id: 'dispute-invoice' });
        return true;
      } catch (error: any) {
        console.error('Dispute invoice error:', error);
        toast.error(error.reason || 'Failed to dispute invoice', { id: 'dispute-invoice' });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [contract]
  );

  const getInvoice = useCallback(
    async (invoiceId: bigint): Promise<Invoice | null> => {
      if (!contract) return null;

      try {
        const result = await contract.getInvoice(invoiceId);
        return {
          id: result[0],
          sender: result[1],
          recipient: result[2],
          amount: result[3],
          description: result[4],
          status: Number(result[5]),
          createdAt: result[6],
          dueDate: result[7],
        };
      } catch (error) {
        console.error('Get invoice error:', error);
        return null;
      }
    },
    [contract]
  );

  const getSentInvoices = useCallback(
    async (address: string): Promise<bigint[]> => {
      if (!contract) return [];

      try {
        return await contract.getSentInvoices(address);
      } catch (error) {
        console.error('Get sent invoices error:', error);
        return [];
      }
    },
    [contract]
  );

  const getReceivedInvoices = useCallback(
    async (address: string): Promise<bigint[]> => {
      if (!contract) return [];

      try {
        return await contract.getReceivedInvoices(address);
      } catch (error) {
        console.error('Get received invoices error:', error);
        return [];
      }
    },
    [contract]
  );

  const getInvoiceCount = useCallback(async (): Promise<bigint> => {
    if (!contract) return 0n;

    try {
      return await contract.getInvoiceCount();
    } catch (error) {
      console.error('Get invoice count error:', error);
      return 0n;
    }
  }, [contract]);

  return {
    contract,
    isLoading,
    createInvoice,
    payInvoice,
    cancelInvoice,
    disputeInvoice,
    getInvoice,
    getSentInvoices,
    getReceivedInvoices,
    getInvoiceCount,
  };
}
