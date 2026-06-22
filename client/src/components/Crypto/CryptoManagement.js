import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const CryptoManagement = () => {
  const [holdings, setHoldings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('holdings');
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showStakingForm, setShowStakingForm] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const { register: registerStaking, handleSubmit: handleStakingSubmit, reset: resetStaking, formState: { errors: stakingErrors } } = useForm();

  const transactionTypes = ['buy', 'sell', 'transfer_in', 'transfer_out', 'stake', 'unstake', 'reward'];
  const walletTypes = ['hot', 'cold', 'exchange', 'hardware', 'mobile', 'web'];

  const fetchHoldings = async () => {
    try {
      const res = await api.get('/api/crypto/holdings');
      setHoldings(res.data.data);
    } catch (e) {
      toast.error('Failed to fetch crypto holdings');
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/api/crypto/transactions');
      setTransactions(res.data.data);
    } catch (e) {
      toast.error('Failed to fetch crypto transactions');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchHoldings(), fetchTransactions()]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const onSubmit = async (data) => {
    try {
      const response = await api.post('/api/crypto/transactions', data);
      toast.success('Crypto transaction added');
      reset();
      setShowTransactionForm(false);
      await Promise.all([fetchHoldings(), fetchTransactions()]);
      window.dispatchEvent(new Event('finance:data-changed'));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to add crypto transaction');
    }
  };

  const onStakingSubmit = async (data) => {
    try {
      await api.post(`/api/crypto/holdings/${selectedHolding._id}/staking`, data);
      toast.success('Staking added');
      resetStaking();
      setShowStakingForm(false);
      setSelectedHolding(null);
      fetchHoldings();
      window.dispatchEvent(new Event('finance:data-changed'));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to add staking');
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await api.delete(`/api/crypto/transactions/${id}`);
      toast.success('Transaction deleted');
      await Promise.all([fetchHoldings(), fetchTransactions()]);
      window.dispatchEvent(new Event('finance:data-changed'));
    } catch (e) {
      toast.error('Failed to delete transaction');
    }
  };

  const removeStaking = async (id) => {
    if (!window.confirm('Remove staking?')) return;
    try {
      await api.delete(`/api/crypto/holdings/${id}/staking`);
      toast.success('Staking removed');
      fetchHoldings();
      window.dispatchEvent(new Event('finance:data-changed'));
    } catch (e) {
      toast.error('Failed to remove staking');
    }
  };

  const openStakingForm = (holding) => {
    setSelectedHolding(holding);
    setShowStakingForm(true);
  };

  const getTransactionTypeColor = (type) => {
    const colors = {
      buy: 'bg-green-100 text-green-800',
      sell: 'bg-red-100 text-red-800',
      transfer_in: 'bg-blue-100 text-blue-800',
      transfer_out: 'bg-orange-100 text-orange-800',
      stake: 'bg-purple-100 text-purple-800',
      unstake: 'bg-pink-100 text-pink-800',
      reward: 'bg-yellow-100 text-yellow-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getProfitLossColor = (value) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const formatCrypto = (amount, symbol) => {
    return `${parseFloat(amount).toFixed(8)} ${symbol}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Crypto Management</h1>
        <p className="text-gray-600">Track your cryptocurrency investments and transactions.</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('holdings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'holdings'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Holdings
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'transactions'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Transactions
          </button>
        </nav>
      </div>

      {/* Holdings Tab */}
      {activeTab === 'holdings' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Crypto Holdings</h3>
            <button
              onClick={() => setShowTransactionForm(true)}
              className="px-4 py-2 rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Add Transaction
            </button>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : holdings.length === 0 ? (
            <p className="text-gray-500">No crypto holdings yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Avg Buy Price</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Current Price</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Current Value</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">P&L</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Staking</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {holdings.map(holding => (
                    <tr key={holding._id}>
                      <td className="px-4 py-2 text-sm font-medium">{holding.symbol}</td>
                      <td className="px-4 py-2 text-sm text-right">{formatCrypto(holding.totalAmount || 0, holding.symbol)}</td>
                      <td className="px-4 py-2 text-sm text-right">{formatCurrency(holding.averageBuyPrice || 0)}</td>
                      <td className="px-4 py-2 text-sm text-right">{formatCurrency(holding.currentPrice || 0)}</td>
                      <td className="px-4 py-2 text-sm text-right">{formatCurrency(holding.currentValue || 0)}</td>
                      <td className={`px-4 py-2 text-sm text-right ${getProfitLossColor(holding.profitLoss || 0)}`}>
                        {formatCurrency(holding.profitLoss || 0)} ({(holding.profitLossPercentage || 0).toFixed(2)}%)
                      </td>
                      <td className="px-4 py-2 text-sm text-center">
                        {holding.staking?.isStaked ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                            {formatCrypto(holding.staking.stakedAmount || 0, holding.symbol)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-center space-x-2">
                        {!holding.staking?.isStaked ? (
                          <button
                            onClick={() => openStakingForm(holding)}
                            className="px-3 py-1 rounded bg-purple-50 text-purple-700 hover:bg-purple-100"
                          >
                            Stake
                          </button>
                        ) : (
                          <button
                            onClick={() => removeStaking(holding._id)}
                            className="px-3 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100"
                          >
                            Unstake
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Crypto Transactions</h3>
            <button
              onClick={() => setShowTransactionForm(true)}
              className="px-4 py-2 rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Add Transaction
            </button>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : transactions.length === 0 ? (
            <p className="text-gray-500">No crypto transactions yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total Value</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">P&L</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map(transaction => (
                    <tr key={transaction._id}>
                      <td className="px-4 py-2 text-sm">
                        {new Date(transaction.transactionDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTransactionTypeColor(transaction.transactionType)}`}>
                          {transaction.transactionType.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-right">{formatCrypto(transaction.amount, transaction.symbol)}</td>
                      <td className="px-4 py-2 text-sm text-right">{formatCurrency(transaction.pricePerUnit)}</td>
                      <td className="px-4 py-2 text-sm text-right">{formatCurrency(transaction.totalValue)}</td>
                      <td className={`px-4 py-2 text-sm text-right ${getProfitLossColor(transaction.profitLoss || 0)}`}>
                        {transaction.transactionType === 'sell' ? formatCurrency(transaction.profitLoss || 0) : '-'}
                      </td>
                      <td className="px-4 py-2 text-sm text-center">
                        <button
                          onClick={() => handleDeleteTransaction(transaction._id)}
                          className="px-3 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Transaction Form Modal */}
      {showTransactionForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Crypto Transaction</h3>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Symbol</label>
                  <input 
                    className="mt-1 w-full rounded-md border-gray-300" 
                    placeholder="e.g., BTC, ETH"
                    {...register('symbol', { required: 'Symbol is required' })} 
                  />
                  {errors.symbol && <p className="text-sm text-red-600 mt-1">{errors.symbol.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input 
                    className="mt-1 w-full rounded-md border-gray-300" 
                    placeholder="e.g., Bitcoin, Ethereum"
                    {...register('name', { required: 'Name is required' })} 
                  />
                  {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Transaction Type</label>
                  <select 
                    className="mt-1 w-full rounded-md border-gray-300" 
                    {...register('transactionType', { required: 'Transaction type is required' })}
                  >
                    <option value="">Select</option>
                    {transactionTypes.map(type => (
                      <option key={type} value={type}>
                        {type.replace('_', ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                  {errors.transactionType && <p className="text-sm text-red-600 mt-1">{errors.transactionType.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <input 
                    type="number" 
                    step="0.00000001" 
                    className="mt-1 w-full rounded-md border-gray-300" 
                    {...register('amount', { required: 'Quantity is required', min: { value: 0, message: 'Must be >= 0' } })} 
                  />
                  {errors.amount && <p className="text-sm text-red-600 mt-1">{errors.amount.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Price per Unit (INR)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="mt-1 w-full rounded-md border-gray-300" 
                    {...register('pricePerUnit', { required: 'Price per unit is required', min: { value: 0, message: 'Must be >= 0' } })} 
                  />
                  {errors.pricePerUnit && <p className="text-sm text-red-600 mt-1">{errors.pricePerUnit.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Transaction Date</label>
                  <input 
                    type="date" 
                    className="mt-1 w-full rounded-md border-gray-300" 
                    {...register('transactionDate', { required: 'Transaction date is required' })} 
                  />
                  {errors.transactionDate && <p className="text-sm text-red-600 mt-1">{errors.transactionDate.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Exchange</label>
                  <input 
                    className="mt-1 w-full rounded-md border-gray-300" 
                    placeholder="e.g., Binance, Coinbase"
                    {...register('exchange.name')} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fees (INR)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="mt-1 w-full rounded-md border-gray-300" 
                    {...register('exchange.fees', { min: { value: 0, message: 'Must be >= 0' } })} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Wallet Type</label>
                  <select 
                    className="mt-1 w-full rounded-md border-gray-300" 
                    {...register('wallet.type')}
                  >
                    <option value="">Select</option>
                    {walletTypes.map(type => (
                      <option key={type} value={type}>
                        {type.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea 
                    className="mt-1 w-full rounded-md border-gray-300" 
                    rows="2"
                    {...register('notes')} 
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowTransactionForm(false);
                      reset();
                    }}
                    className="px-4 py-2 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 rounded-md text-white bg-primary-600 hover:bg-primary-700">
                    Add Transaction
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Staking Form Modal */}
      {showStakingForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Add Staking for {selectedHolding?.symbol}
              </h3>
              <form onSubmit={handleStakingSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity to Stake</label>
                  <input 
                    type="number" 
                    step="0.00000001" 
                    className="mt-1 w-full rounded-md border-gray-300" 
                    max={selectedHolding?.totalAmount}
                    {...registerStaking('amount', { required: 'Quantity is required', min: { value: 0, message: 'Must be >= 0' } })} 
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Available: {formatCrypto(selectedHolding?.totalAmount || 0, selectedHolding?.symbol || '')}
                  </p>
                  {stakingErrors.amount && <p className="text-sm text-red-600 mt-1">{stakingErrors.amount.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">APY (%)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="mt-1 w-full rounded-md border-gray-300" 
                    {...registerStaking('apy', { required: 'APY is required', min: { value: 0, message: 'Must be >= 0' } })} 
                  />
                  {stakingErrors.apy && <p className="text-sm text-red-600 mt-1">{stakingErrors.apy.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <input 
                    type="date" 
                    className="mt-1 w-full rounded-md border-gray-300" 
                    {...registerStaking('endDate', { required: 'End date is required' })} 
                  />
                  {stakingErrors.endDate && <p className="text-sm text-red-600 mt-1">{stakingErrors.endDate.message}</p>}
                </div>
                <div className="flex justify-end space-x-3">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowStakingForm(false);
                      setSelectedHolding(null);
                      resetStaking();
                    }}
                    className="px-4 py-2 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 rounded-md text-white bg-primary-600 hover:bg-primary-700">
                    Add Staking
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CryptoManagement;
