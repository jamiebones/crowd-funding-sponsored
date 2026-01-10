'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ServerWallet {
  _id: string;
  address: string;
  campaignCount: number;
  isActive: boolean;
  createdAt: string;
}

interface WalletWithBalance extends ServerWallet {
  bnbBalance?: string;
  balanceLoading?: boolean;
}

export default function ServerWalletsPage() {
  const [wallets, setWallets] = useState<WalletWithBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [privateKey, setPrivateKey] = useState('');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/wallets');
      const data = await response.json();
      
      if (data.success) {
        const walletsData = data.wallets.map((w: ServerWallet) => ({
          ...w,
          balanceLoading: true
        }));
        setWallets(walletsData);
        
        // Fetch balances for each wallet
        walletsData.forEach((wallet: ServerWallet) => {
          fetchWalletBalance(wallet.address);
        });
      } else {
        setError('Failed to fetch wallets');
      }
    } catch (err) {
      setError('Error fetching wallets');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletBalance = async (address: string) => {
    try {
      const response = await fetch(`https://api.bscscan.com/api?module=account&action=balance&address=${address}&tag=latest&apikey=YourApiKeyToken`);
      const data = await response.json();
      
      if (data.status === '1') {
        const balanceInBNB = (parseInt(data.result) / 1e18).toFixed(6);
        setWallets(prev => prev.map(w => 
          w.address === address 
            ? { ...w, bnbBalance: balanceInBNB, balanceLoading: false }
            : w
        ));
      } else {
        // Fallback to RPC call if BSCScan fails
        setWallets(prev => prev.map(w => 
          w.address === address 
            ? { ...w, bnbBalance: '0.000000', balanceLoading: false }
            : w
        ));
      }
    } catch (err) {
      console.error('Error fetching balance:', err);
      setWallets(prev => prev.map(w => 
        w.address === address 
          ? { ...w, bnbBalance: 'Error', balanceLoading: false }
          : w
      ));
    }
  };

  const importWallet = async () => {
    if (!privateKey.trim()) {
      setError('Please enter a private key');
      return;
    }

    try {
      setImporting(true);
      setError('');
      setSuccessMessage('');
      
      const response = await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          privateKey: privateKey.trim(),
          performedBy: 'ADMIN' 
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage(`Wallet ${data.wallet.address} imported successfully`);
        setPrivateKey('');
        setShowImportModal(false);
        fetchWallets();
      } else {
        setError(data.error || 'Failed to import wallet');
      }
    } catch (err) {
      setError('Error importing wallet');
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  const toggleWalletStatus = async (address: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/wallets/${address}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          isActive: !currentStatus,
          performedBy: 'ADMIN' 
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage(`Wallet ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        fetchWallets();
      } else {
        setError('Failed to update wallet status');
      }
    } catch (err) {
      setError('Error updating wallet');
      console.error(err);
    }
  };

  const deleteWallet = async (address: string, campaignCount: number) => {
    if (campaignCount > 0) {
      setError(`Cannot delete wallet with ${campaignCount} campaign(s) attached. Please reassign or complete campaigns first.`);
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete wallet ${truncateAddress(address)}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/wallets/${address}?performedBy=ADMIN`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage('Wallet deleted successfully');
        fetchWallets();
      } else {
        setError(data.error || 'Failed to delete wallet');
      }
    } catch (err) {
      setError('Error deleting wallet');
      console.error(err);
    }
  };

  const copyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Server Wallets
        </h1>
        <p className="text-gray-600 text-lg">Manage server-controlled wallets for campaign creation</p>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg shadow-sm flex items-start gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="font-medium text-red-800">Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg shadow-sm flex items-start gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="font-medium text-green-800">Success</p>
            <p className="text-green-700 text-sm">{successMessage}</p>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-green-500 hover:text-green-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mb-6 flex gap-3">
        <button
          onClick={() => setShowImportModal(true)}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md font-medium inline-flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Import Wallet
        </button>
        <button
          onClick={fetchWallets}
          disabled={loading}
          className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all shadow-sm hover:shadow-md font-medium inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Wallets Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : wallets.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <p className="text-gray-900 font-medium mb-1">No wallets found</p>
          <p className="text-gray-500 text-sm mb-4">Import a wallet to get started</p>
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition inline-flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Import Wallet
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Wallet Address
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Campaigns
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {wallets.map((wallet, idx) => (
                  <tr 
                    key={wallet.address} 
                    className={`transition-colors hover:bg-blue-50/50 ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://bscscan.com/address/${wallet.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-mono text-sm font-medium transition-colors inline-flex items-center gap-1"
                          title={wallet.address}
                        >
                          {truncateAddress(wallet.address)}
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                        <button
                          onClick={() => copyAddress(wallet.address)}
                          className="p-1.5 hover:bg-gray-200 rounded-md transition-colors group"
                          title={copiedAddress === wallet.address ? 'Copied!' : 'Copy address'}
                        >
                          {copiedAddress === wallet.address ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 text-gray-500 group-hover:text-gray-700"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{wallet.campaignCount}</span>
                        <span className="text-xs text-gray-500">campaigns</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {wallet.balanceLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin h-3 w-3 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
                            <span className="text-xs text-gray-400">Loading...</span>
                          </div>
                        ) : (
                          <div className="font-mono text-sm">
                            <span className="font-semibold text-gray-900">{wallet.bnbBalance || '0.000000'}</span>
                            <span className="text-xs text-gray-500 ml-1">BNB</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(wallet.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex items-center gap-1.5 text-xs font-semibold rounded-full ${
                          wallet.isActive
                            ? 'bg-green-100 text-green-800 ring-1 ring-green-600/20'
                            : 'bg-red-100 text-red-800 ring-1 ring-red-600/20'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          wallet.isActive ? 'bg-green-600' : 'bg-red-600'
                        }`}></span>
                        {wallet.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/new-project?serverWallet=${wallet.address}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                          title="Create Campaign"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                          Create
                        </Link>
                        <button
                          onClick={() => toggleWalletStatus(wallet.address, wallet.isActive)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors font-medium ${
                            wallet.isActive
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                          title={wallet.isActive ? 'Deactivate Wallet' : 'Activate Wallet'}
                        >
                          {wallet.isActive ? (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                              </svg>
                              Pause
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Activate
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => deleteWallet(wallet.address, wallet.campaignCount)}
                          disabled={wallet.campaignCount > 0}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors font-medium ${
                            wallet.campaignCount > 0
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-red-600 text-white hover:bg-red-700'
                          }`}
                          title={wallet.campaignCount > 0 ? `Cannot delete wallet with ${wallet.campaignCount} campaign(s)` : 'Remove Wallet'}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Table Footer with Stats */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <div className="text-gray-600">
                <span className="font-semibold text-gray-900">{wallets.length}</span> total wallet{wallets.length !== 1 ? 's' : ''}
              </div>
              <div className="flex items-center gap-6">
                <div className="text-gray-600">
                  <span className="font-semibold text-green-700">{wallets.filter(w => w.isActive).length}</span> active
                </div>
                <div className="text-gray-600">
                  <span className="font-semibold text-red-700">{wallets.filter(w => !w.isActive).length}</span> inactive
                </div>
                <div className="text-gray-600">
                  <span className="font-semibold text-blue-700">{wallets.reduce((sum, w) => sum + w.campaignCount, 0)}</span> campaigns
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Import Wallet</h2>
                <p className="text-sm text-gray-600">
                  Enter a private key to import a wallet
                </p>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setPrivateKey('');
                  setError('');
                }}
                disabled={importing}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-blue-800">
                The key will be encrypted and stored securely on the server. Never share your private key with anyone.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Private Key
              </label>
              <input
                type="password"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="0x... (64 hex characters)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={importing}
                autoFocus
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={importWallet}
                disabled={importing || !privateKey.trim()}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed font-medium inline-flex items-center justify-center gap-2"
              >
                {importing ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Importing...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                    </svg>
                    Import Wallet
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setPrivateKey('');
                  setError('');
                }}
                disabled={importing}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
