import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useContract, Invoice } from '../hooks/useContract';
import { useFhevm, CONTRACT_ADDRESS } from '../hooks/useFhevm';

interface InvoiceListProps {
  account: string;
  type: 'sent' | 'received';
}

const InvoiceList: React.FC<InvoiceListProps> = ({ account, type }) => {
  const { getSentInvoices, getReceivedInvoices, getInvoice, payInvoice, cancelInvoice, isLoading } =
    useContract();
  const { decryptAmount, isInitialized } = useFhevm();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [decryptingId, setDecryptingId] = useState<bigint | null>(null);

  const loadInvoices = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const invoiceIds =
        type === 'sent'
          ? await getSentInvoices(account)
          : await getReceivedInvoices(account);

      const invoiceDetails = await Promise.all(
        invoiceIds.map((id) => getInvoice(id))
      );

      setInvoices(invoiceDetails.filter((inv): inv is Invoice => inv !== null));
    } catch (error) {
      console.error('Failed to load invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setIsLoadingList(false);
    }
  }, [account, type, getSentInvoices, getReceivedInvoices, getInvoice]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const handleDecrypt = async (invoice: Invoice) => {
    if (!isInitialized || !CONTRACT_ADDRESS) {
      toast.error('FHE not initialized');
      return;
    }

    setDecryptingId(invoice.id);
    try {
      toast.loading('Decrypting amount...', { id: 'decrypt' });
      const decrypted = await decryptAmount(invoice.encryptedAmount!, CONTRACT_ADDRESS);

      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoice.id ? { ...inv, decryptedAmount: decrypted } : inv
        )
      );
      toast.success('Amount decrypted!', { id: 'decrypt' });
    } catch (error: any) {
      console.error('Decryption failed:', error);
      toast.error('Failed to decrypt amount', { id: 'decrypt' });
    } finally {
      setDecryptingId(null);
    }
  };

  const handlePay = async (invoiceId: bigint) => {
    const success = await payInvoice(invoiceId);
    if (success) {
      loadInvoices();
    }
  };

  const handleCancel = async (invoiceId: bigint) => {
    const success = await cancelInvoice(invoiceId);
    if (success) {
      loadInvoices();
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return <span className="status-pending">Pending</span>;
      case 1:
        return <span className="status-paid">Paid</span>;
      case 2:
        return <span className="status-cancelled">Cancelled</span>;
      default:
        return null;
    }
  };

  const formatAmount = (amount: bigint) => {
    return (Number(amount) / 1e18).toFixed(6);
  };

  if (isLoadingList) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg className="animate-spin h-8 w-8 text-fhe-purple" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {type === 'sent' ? 'Sent Invoices' : 'Received Invoices'}
          </h2>
          <p className="text-gray-500">
            {invoices.length} invoice{invoices.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <button onClick={loadInvoices} className="btn-secondary flex items-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {invoices.length === 0 ? (
        <div className="card text-center py-12">
          <svg
            className="w-16 h-16 text-gray-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No invoices yet</h3>
          <p className="text-gray-500">
            {type === 'sent'
              ? "You haven't sent any invoices yet."
              : "You haven't received any invoices yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <div key={invoice.id.toString()} className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <span className="text-lg font-semibold text-gray-900">
                      Invoice #{invoice.id.toString()}
                    </span>
                    {getStatusBadge(invoice.status)}
                  </div>
                  <p className="text-gray-600">{invoice.description}</p>
                </div>
                <div className="text-right">
                  {invoice.decryptedAmount !== undefined ? (
                    <p className="text-xl font-bold text-gray-900">
                      {formatAmount(invoice.decryptedAmount)} ZAMA
                    </p>
                  ) : (
                    <button
                      onClick={() => handleDecrypt(invoice)}
                      disabled={decryptingId === invoice.id}
                      className="text-fhe-purple hover:text-fhe-blue transition-colors text-sm font-medium flex items-center space-x-1"
                    >
                      {decryptingId === invoice.id ? (
                        <span className="animate-pulse">Decrypting...</span>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                            />
                          </svg>
                          <span>Decrypt Amount</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">From</p>
                  <p className="font-mono text-gray-900">{formatAddress(invoice.sender)}</p>
                </div>
                <div>
                  <p className="text-gray-500">To</p>
                  <p className="font-mono text-gray-900">{formatAddress(invoice.recipient)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Created</p>
                  <p className="text-gray-900">{formatDate(invoice.createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Updated</p>
                  <p className="text-gray-900">{formatDate(invoice.updatedAt)}</p>
                </div>
              </div>

              {invoice.status === 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end space-x-3">
                  {type === 'received' && (
                    <button
                      onClick={() => handlePay(invoice.id)}
                      disabled={isLoading}
                      className="btn-primary py-2 px-4 text-sm"
                    >
                      Mark as Paid
                    </button>
                  )}
                  {type === 'sent' && (
                    <button
                      onClick={() => handleCancel(invoice.id)}
                      disabled={isLoading}
                      className="bg-red-100 text-red-700 font-semibold py-2 px-4 rounded-lg text-sm hover:bg-red-200 transition-colors"
                    >
                      Cancel Invoice
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvoiceList;
