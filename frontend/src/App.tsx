import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useWallet } from './hooks/useWallet';
import { useFhevm } from './hooks/useFhevm';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CreateInvoice from './components/CreateInvoice';
import InvoiceList from './components/InvoiceList';
import ConnectWallet from './components/ConnectWallet';

type Tab = 'dashboard' | 'create' | 'sent' | 'received';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const { account, chainId, connect, disconnect, isConnecting } = useWallet();
  useFhevm(); // Auto-initializes FHE SDK on mount

  if (!account) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <Toaster position="top-right" />
        <ConnectWallet onConnect={connect} isConnecting={isConnecting} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <Header
        account={account}
        chainId={chainId}
        onDisconnect={disconnect}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <Dashboard account={account} />}
        {activeTab === 'create' && <CreateInvoice account={account} />}
        {activeTab === 'sent' && <InvoiceList account={account} type="sent" />}
        {activeTab === 'received' && <InvoiceList account={account} type="received" />}
      </main>
    </div>
  );
}

export default App;
