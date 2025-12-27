import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ethers } from 'ethers';
import { useFhevm, CONTRACT_ADDRESS } from '../hooks/useFhevm';
import { useContract } from '../hooks/useContract';

interface CreateInvoiceProps {
  account: string;
}

interface InvoiceFormData {
  recipient: string;
  amount: string;
  description: string;
}

const CreateInvoice: React.FC<CreateInvoiceProps> = ({ account }) => {
  const { encryptAmount, isInitialized } = useFhevm();
  const { createInvoice, isLoading } = useContract();
  const [isEncrypting, setIsEncrypting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InvoiceFormData>();

  const onSubmit = async (data: InvoiceFormData) => {
    if (!isInitialized) {
      toast.error('FHE not initialized. Please wait...');
      return;
    }

    if (!CONTRACT_ADDRESS) {
      toast.error('Contract not deployed. Please deploy the contract first.');
      return;
    }

    setIsEncrypting(true);

    try {
      // Convert amount to smallest unit (like wei)
      const amountBigInt = BigInt(Math.floor(parseFloat(data.amount) * 1e18));

      toast.loading('Encrypting amount...', { id: 'encrypt' });

      // Encrypt the amount
      const { encryptedAmount, inputProof } = await encryptAmount(
        amountBigInt,
        CONTRACT_ADDRESS,
        account
      );

      toast.success('Amount encrypted!', { id: 'encrypt' });

      // Create the invoice on-chain
      const invoiceId = await createInvoice(
        data.recipient,
        encryptedAmount,
        inputProof,
        data.description
      );

      if (invoiceId !== null) {
        toast.success(`Invoice #${invoiceId.toString()} created successfully!`);
        reset();
      }
    } catch (error: any) {
      console.error('Create invoice error:', error);
      toast.error(error.message || 'Failed to create invoice', { id: 'encrypt' });
    } finally {
      setIsEncrypting(false);
    }
  };

  const isProcessing = isEncrypting || isLoading;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Invoice</h2>
        <p className="text-gray-500">
          Send an encrypted invoice. Only you and the recipient can view the amount.
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
            disabled={isProcessing}
          />
          {errors.recipient && (
            <p className="mt-1 text-sm text-red-600">{errors.recipient.message}</p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount
            <span className="ml-2 text-xs text-fhe-purple font-normal">
              (will be encrypted)
            </span>
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
              disabled={isProcessing}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
              <span className="text-gray-400">ZAMA</span>
            </div>
          </div>
          {errors.amount && (
            <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
          )}
          <p className="mt-2 text-xs text-gray-500 flex items-center">
            <svg
              className="w-4 h-4 mr-1 text-fhe-purple"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            This amount will be encrypted using FHE before being stored on-chain
          </p>
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
            disabled={isProcessing}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isProcessing || !isInitialized}
          className="btn-primary w-full flex items-center justify-center space-x-2"
        >
          {isProcessing ? (
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
              <span>{isEncrypting ? 'Encrypting...' : 'Creating Invoice...'}</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span>Create Encrypted Invoice</span>
            </>
          )}
        </button>

        {!isInitialized && (
          <p className="text-center text-sm text-yellow-600">
            Initializing FHE encryption... Please wait.
          </p>
        )}
      </form>
    </div>
  );
};

export default CreateInvoice;
