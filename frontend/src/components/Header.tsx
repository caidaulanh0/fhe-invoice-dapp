import React from 'react';

type Tab = 'dashboard' | 'create' | 'sent' | 'received';

interface HeaderProps {
  account: string;
  chainId: number | null;
  onDisconnect: () => void;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const Header: React.FC<HeaderProps> = ({
  account,
  chainId,
  onDisconnect,
  activeTab,
  onTabChange,
}) => {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getNetworkName = (id: number | null) => {
    if (id === 11155111) return 'Sepolia';
    if (id === 1) return 'Mainnet';
    return 'Unknown';
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'create', label: 'Create Invoice' },
    { id: 'sent', label: 'Sent' },
    { id: 'received', label: 'Received' },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-fhe-purple to-fhe-blue rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">FI</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">FHE Invoice</h1>
              <p className="text-xs text-gray-500">Encrypted Invoicing</p>
            </div>
          </div>

          <nav className="hidden md:flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-fhe-purple text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="flex items-center space-x-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    chainId === 11155111 ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                />
                <span className="text-sm text-gray-600">{getNetworkName(chainId)}</span>
              </div>
              <p className="text-sm font-mono text-gray-900">{formatAddress(account)}</p>
            </div>
            <button
              onClick={onDisconnect}
              className="text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>

        {/* Mobile navigation */}
        <nav className="md:hidden flex space-x-1 pb-3 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-fhe-purple text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;
