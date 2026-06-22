import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const StockManagement = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchStocks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/stocks');
      setStocks(res.data.data);
    } catch (e) {
      toast.error('Failed to fetch stocks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  const onSubmit = async (data) => {
    try {
      await api.post('/api/stocks', data);
      toast.success('Stock added');
      reset();
      fetchStocks();
      window.dispatchEvent(new Event('finance:data-changed'));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to add stock');
    }
  };

  const { register: registerTxn, handleSubmit: handleSubmitTxn, reset: resetTxn, formState: { errors: txnErrors } } = useForm();

  const onAddTransaction = async (data) => {
    try {
      if (!data.stockId) {
        toast.error('Select a stock');
        return;
      }
      await api.post(`/api/stocks/${data.stockId}/transaction`, {
        type: data.type || 'buy',
        quantity: Number(data.quantity),
        price: Number(data.price),
        date: data.date || undefined,
        brokerage: data.brokerage ? Number(data.brokerage) : 0,
        notes: data.notes || ''
      });
      toast.success('Transaction added');
      resetTxn();
      fetchStocks();
      window.dispatchEvent(new Event('finance:data-changed'));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to add transaction');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this stock?')) return;
    try {
      await api.delete(`/api/stocks/${id}`);
      toast.success('Stock deleted');
      fetchStocks();
      window.dispatchEvent(new Event('finance:data-changed'));
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Stock Management</h1>
        <p className="text-gray-600">Track your stock portfolio and investments.</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add Stock</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Symbol</label>
            <input className="mt-1 w-full rounded-md border-gray-300" {...register('symbol',{required:'Symbol is required'})} />
            {errors.symbol && <p className="text-sm text-red-600 mt-1">{errors.symbol.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Company Name</label>
            <input className="mt-1 w-full rounded-md border-gray-300" {...register('companyName',{required:'Company name is required'})} />
            {errors.companyName && <p className="text-sm text-red-600 mt-1">{errors.companyName.message}</p>}
          </div>
          <div className="md:col-span-3 flex justify-end">
            <button type="submit" className="px-4 py-2 rounded-md text-white bg-primary-600 hover:bg-primary-700">Save</button>
          </div>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add Transaction</h3>
        <form onSubmit={handleSubmitTxn(onAddTransaction)} className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Stock</label>
            <select className="mt-1 w-full rounded-md border-gray-300" {...registerTxn('stockId',{required:'Required'})}>
              <option value="">Select stock</option>
              {stocks.map(s => <option key={s._id} value={s._id}>{s.symbol} - {s.companyName}</option>)}
            </select>
            {txnErrors.stockId && <p className="text-sm text-red-600 mt-1">{txnErrors.stockId.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select className="mt-1 w-full rounded-md border-gray-300" defaultValue="buy" {...registerTxn('type')}>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Quantity</label>
            <input type="number" step="0.01" className="mt-1 w-full rounded-md border-gray-300" {...registerTxn('quantity',{required:'Required', min:{value:0.01, message:'> 0'}})} />
            {txnErrors.quantity && <p className="text-sm text-red-600 mt-1">{txnErrors.quantity.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Price</label>
            <input type="number" step="0.01" className="mt-1 w-full rounded-md border-gray-300" {...registerTxn('price',{required:'Required', min:{value:0, message:'>= 0'}})} />
            {txnErrors.price && <p className="text-sm text-red-600 mt-1">{txnErrors.price.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date (optional)</label>
            <input type="date" className="mt-1 w-full rounded-md border-gray-300" {...registerTxn('date')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Brokerage (optional)</label>
            <input type="number" step="0.01" className="mt-1 w-full rounded-md border-gray-300" {...registerTxn('brokerage')} />
          </div>
          <div className="md:col-span-6">
            <label className="block text-sm font-medium text-gray-700">Notes (optional)</label>
            <input className="mt-1 w-full rounded-md border-gray-300" {...registerTxn('notes')} />
          </div>
          <div className="md:col-span-6 flex justify-end">
            <button type="submit" className="px-4 py-2 rounded-md text-white bg-primary-600 hover:bg-primary-700">Add Transaction</button>
          </div>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Stocks</h3>
        {loading ? (
          <p>Loading...</p>
        ) : stocks.length === 0 ? (
          <p className="text-gray-500">No stocks yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Current Value</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr></thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stocks.map(s => (
                  <tr key={s._id}>
                    <td className="px-4 py-2 text-sm">{s.symbol}</td>
                    <td className="px-4 py-2 text-sm">{s.companyName}</td>
                    <td className="px-4 py-2 text-sm text-right">{new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(s.currentValue || 0)}</td>
                    <td className="px-4 py-2 text-sm text-right">
                      <button onClick={() => handleDelete(s._id)} className="px-3 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockManagement;
