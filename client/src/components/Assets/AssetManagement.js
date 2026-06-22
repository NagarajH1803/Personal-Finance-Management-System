import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const AssetManagement = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const types = ['real_estate','vehicle','jewelry','electronics','furniture','investment','other'];

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/assets');
      setAssets(res.data.data);
    } catch (e) {
      toast.error('Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const onSubmit = async (data) => {
    try {
      await api.post('/api/assets', data);
      toast.success('Asset added');
      reset();
      fetchAssets();
      window.dispatchEvent(new Event('finance:data-changed'));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to add asset');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this asset?')) return;
    try {
      await api.delete(`/api/assets/${id}`);
      toast.success('Asset deleted');
      fetchAssets();
      window.dispatchEvent(new Event('finance:data-changed'));
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Asset Management</h1>
        <p className="text-gray-600">Track your real estate, vehicles, and other assets.</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add Asset</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input className="mt-1 w-full rounded-md border-gray-300" {...register('name',{required:'Name is required'})} />
            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select className="mt-1 w-full rounded-md border-gray-300" {...register('type',{required:'Type is required'})}>
              <option value="">Select</option>
              {types.map(t=> <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Purchase Price</label>
            <input type="number" step="0.01" className="mt-1 w-full rounded-md border-gray-300" {...register('purchasePrice',{required:'Required', min:{value:0, message:'Must be >= 0'}})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Current Value</label>
            <input type="number" step="0.01" className="mt-1 w-full rounded-md border-gray-300" {...register('currentValue',{required:'Required', min:{value:0, message:'Must be >= 0'}})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Purchase Date</label>
            <input type="date" className="mt-1 w-full rounded-md border-gray-300" {...register('purchaseDate',{required:'Required'})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Depreciation Rate (%)</label>
            <input type="number" step="0.01" className="mt-1 w-full rounded-md border-gray-300" {...register('depreciationRate')} />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <button type="submit" className="px-4 py-2 rounded-md text-white bg-primary-600 hover:bg-primary-700">Save</button>
          </div>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Assets</h3>
        {loading ? (
          <p>Loading...</p>
        ) : assets.length === 0 ? (
          <p className="text-gray-500">No assets yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Current Value</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assets.map(a => (
                  <tr key={a._id}>
                    <td className="px-4 py-2 text-sm">{a.name}</td>
                    <td className="px-4 py-2 text-sm">{a.type}</td>
                    <td className="px-4 py-2 text-sm text-right">{new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(a.currentValue)}</td>
                    <td className="px-4 py-2 text-sm text-right">
                      <button onClick={() => handleDelete(a._id)} className="px-3 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100">Delete</button>
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

export default AssetManagement;
