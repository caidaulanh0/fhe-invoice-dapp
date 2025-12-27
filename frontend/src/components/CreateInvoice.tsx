import React from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS } from '../hooks/useFhevm';
import { useContract } from '../hooks/useContract';

interface CreateInvoiceProps {
  account: string;
}

interface InvoiceFormData {
  recipient: string;
  amount: string;
  description: string;
}

const CreateInvoice: React.FC<CreateInvoiceProps> = ({ account: _account }) => {
  const { createInvoice, isLoading } = useContract();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InvoiceFormData>();

  const onSubmit = async (data: InvoiceFormData) => {
    if (!CONTRACT_ADDRESS) {
      toast.error('Contract not deployed. Please deploy the contract first.');
      return;
    }

    try {
      // Convert amount to wei (smallest unit)
      const amountWei = ethers.parseEther(data.amount);

      // Create the invoice on-chain
      const invoiceId = await createInvoice(
        data.recipient,
        amountWei,
        data.description
      );

      if (invoiceId !== null) {
        toast.success(`Invoice #${invoiceId.toString()} created successfully!`);
        reset();
      }
    } catch (error: any) {
      console.error('Create invoice error:', error);
      toast.error(error.message || 'Failed to create invoice');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Invoice</h2>
        <p className="text-gray-500">
          Send an invoice to another address. They will be able to pay it on-chain.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-6">
        {/* Recipient */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recipient Address
          </label>
          <input
            type="text"
            {...register('recipient', {
              required: 'Recipient address is required',
              validate: (value) =>
                ethers.isAddress(value) || 'Invalid Ethereum address',
            })}
            placeholder="0x..."
            className="input-field"
            disabled={isLoading}
          />
          {errors.recipient && (
            <p className="mt-1 text-sm text-red-600">{errors.recipient.message}</p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.000001"
              min="0"
              {...register('amount', {
                required: 'Amount is required',
                min: { value: 0.000001, message: 'Amount must be greater than 0' },
              })}
              placeholder="0.00"
              className="input-field pr-16"
              disabled={isLoading}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
              <span className="text-gray-400">ETH</span>
            </div>
          </div>
          {errors.amount && (
            <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            {...register('description', {
              required: 'Description is required',
              maxLength: { value: 256, message: 'Description too long (max 256 chars)' },
            })}
            rows={3}
            placeholder="Enter invoice description..."
            className="input-field resize-none"
            disabled={isLoading}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
              <span>Creating Invoice...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>Create Invoice</span>
            </>
          )}
        </button>

        <p className="text-center text-xs text-gray-500 mt-2">
          Built on Zama fhEVM (Sepolia Testnet)
        </p>
      </form>
    </div>
  );
};

export default CreateInvoice;
