import React, { useEffect, useState } from 'react';
import { useContract } from '../hooks/useContract';

interface DashboardProps {
  account: string;
}

const Dashboard: React.FC<DashboardProps> = ({ account }) => {
  const { getSentInvoices, getReceivedInvoices, getInvoiceCount } = useContract();
  const [stats, setStats] = useState({
    totalInvoices: 0n,
    sentCount: 0,
    receivedCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      try {
        const [total, sent, received] = await Promise.all([
          getInvoiceCount(),
          getSentInvoices(account),
          getReceivedInvoices(account),
        ]);

        setStats({
          totalInvoices: total,
          sentCount: sent.length,
          receivedCount: received.length,
        });
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [account, getSentInvoices, getReceivedInvoices, getInvoiceCount]);

  const statCards = [
    {
      title: 'Total Invoices',
      value: stats.totalInvoices.toString(),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Invoices Sent',
      value: stats.sentCount.toString(),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
          />
        </svg>
      ),
      color: 'from-fhe-purple to-purple-600',
    },
    {
      title: 'Invoices Received',
      value: stats.receivedCount.toString(),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      ),
      color: 'from-fhe-cyan to-cyan-600',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h2>
        <p className="text-gray-500">Overview of your encrypted invoicing activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {isLoading ? '-' : card.value}
                </p>
              </div>
              <div
                className={`w-14 h-14 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center text-white`}
              >
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Section */}
      <div className="card bg-gradient-to-r from-fhe-purple/5 to-fhe-blue/5 border border-fhe-purple/20">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-fhe-purple to-fhe-blue rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">
              Fully Homomorphic Encryption
            </h3>
            <p className="text-gray-600 text-sm">
              Your invoice amounts are encrypted using Zama's fhEVM technology. Only you and
              the invoice recipient can decrypt and view the actual amounts. All data remains
              encrypted on-chain, ensuring complete privacy.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card hover:border-fhe-purple border-2 border-transparent cursor-pointer transition-colors">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Create New Invoice</h4>
              <p className="text-sm text-gray-500">Send an encrypted invoice to any address</p>
            </div>
          </div>
        </div>

        <div className="card hover:border-fhe-blue border-2 border-transparent cursor-pointer transition-colors">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">View All Invoices</h4>
              <p className="text-sm text-gray-500">Manage your sent and received invoices</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
