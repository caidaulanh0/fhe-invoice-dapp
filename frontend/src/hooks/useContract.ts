import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { CONTRACT_ADDRESS } from './useFhevm';

// InvoiceManager ABI
const INVOICE_MANAGER_ABI = [
  'function createInvoice(address _recipient, bytes32 _encryptedAmount, bytes calldata _inputProof, string calldata _description) external returns (uint256)',
  'function payInvoice(uint256 _invoiceId) external',
  'function cancelInvoice(uint256 _invoiceId) external',
  'function getInvoice(uint256 _invoiceId) external view returns (uint256 id, address sender, address recipient, string memory description, uint8 status, uint256 createdAt, uint256 updatedAt)',
  'function getEncryptedAmount(uint256 _invoiceId) external view returns (bytes32)',
  'function getSentInvoices(address _sender) external view returns (uint256[])',
  'function getReceivedInvoices(address _recipient) external view returns (uint256[])',
  'function getInvoiceCount() external view returns (uint256)',
  'event InvoiceCreated(uint256 indexed invoiceId, address indexed sender, address indexed recipient, string description, uint256 timestamp)',
  'event InvoicePaid(uint256 indexed invoiceId, address indexed payer, uint256 timestamp)',
  'event InvoiceCancelled(uint256 indexed invoiceId, address indexed canceller, uint256 timestamp)',
];

export interface Invoice {
  id: bigint;
  sender: string;
  recipient: string;
  description: string;
  status: number;
  createdAt: bigint;
  updatedAt: bigint;
  encryptedAmount?: string;
  decryptedAmount?: bigint;
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
          INVOICE_MANAGER_ABI,
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
      encryptedAmount: string,
      inputProof: string,
      description: string
    ) => {
      if (!contract) {
        toast.error('Contract not initialized');
        return null;
      }

      setIsLoading(true);
      try {
        const tx = await contract.createInvoice(
          recipient,
          encryptedAmount,
          inputProof,
          description
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

  const getInvoice = useCallback(
    async (invoiceId: bigint): Promise<Invoice | null> => {
      if (!contract) return null;

      try {
        const result = await contract.getInvoice(invoiceId);
        return {
          id: result.id,
          sender: result.sender,
          recipient: result.recipient,
          description: result.description,
          status: result.status,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
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
    getInvoice,
    getSentInvoices,
    getReceivedInvoices,
    getInvoiceCount,
  };
}
