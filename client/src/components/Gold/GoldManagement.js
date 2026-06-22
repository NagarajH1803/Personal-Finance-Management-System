import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const GoldManagement = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const types = ['jewelry','coins','bars','etf','other'];
  const units = ['grams','tolas','ounces'];

  const fetchGold = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/gold');
      setItems(res.data.data);
    } catch (e) {
      toast.error('Failed to fetch gold');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGold();
  }, []);

  const onSubmit = async (data) => {
    try {
      await api.post('/api/gold', data);
      toast.success('Gold added');
      reset();
      fetchGold();
      window.dispatchEvent(new Event('finance:data-changed'));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to add gold');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await api.delete(`/api/gold/${id}`);
      toast.success('Deleted');
      fetchGold();
      window.dispatchEvent(new Event('finance:data-changed'));
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gold Investments</h1>
        <p className="text-gray-600">Track your gold holdings and investments.</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add Gold</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select className="mt-1 w-full rounded-md border-gray-300" {...register('type',{required:'Required'})}>
              <option value="">Select type</option>
              {types.map(t=> <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Quantity</label>
            <input type="number" step="0.01" className="mt-1 w-full rounded-md border-gray-300" {...register('quantity',{required:'Required', min:{value:0.01, message:'> 0'}})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Unit</label>
            <select className="mt-1 w-full rounded-md border-gray-300" {...register('unit',{required:'Required'})}>
              {units.map(u=> <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Purchase Price (per unit)</label>
            <input type="number" step="0.01" className="mt-1 w-full rounded-md border-gray-300" {...register('purchasePrice',{required:'Required', min:{value:0, message:'>= 0'}})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Purchase Date</label>
            <input type="date" className="mt-1 w-full rounded-md border-gray-300" {...register('purchaseDate',{required:'Required'})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Purity (%)</label>
            <input type="number" step="0.01" className="mt-1 w-full rounded-md border-gray-300" {...register('purity')} />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <button type="submit" className="px-4 py-2 rounded-md text-white bg-primary-600 hover:bg-primary-700">Save</button>
          </div>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Gold Holdings</h3>
        {loading ? (
          <p>Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-gray-500">No gold holdings yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Purchase Value</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map(g => (
                  <tr key={g._id}>
                    <td className="px-4 py-2 text-sm">{g.type}</td>
                    <td className="px-4 py-2 text-sm">{g.quantity} {g.unit}</td>
                    <td className="px-4 py-2 text-sm text-right">{new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(g.purchaseValue)}</td>
                    <td className="px-4 py-2 text-sm text-right">
                      <button onClick={() => handleDelete(g._id)} className="px-3 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100">Delete</button>
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

export default GoldManagement;
