import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const FixedDepositManagement = () => {
  const [fds, setFds] = useState([]);
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchFDs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/fixed-deposits');
      setFds(res.data.data);
    } catch (e) {
      toast.error('Failed to fetch FDs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFDs();
  }, []);

  const onSubmit = async (data) => {
    try {
      await api.post('/api/fixed-deposits', data);
      toast.success('FD added');
      reset();
      fetchFDs();
      window.dispatchEvent(new Event('finance:data-changed'));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to add FD');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this FD?')) return;
    try {
      await api.delete(`/api/fixed-deposits/${id}`);
      toast.success('FD deleted');
      fetchFDs();
      window.dispatchEvent(new Event('finance:data-changed'));
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fixed Deposits</h1>
        <p className="text-gray-600">Manage your fixed deposit investments.</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add Fixed Deposit</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Bank Name</label>
            <input className="mt-1 w-full rounded-md border-gray-300" {...register('bankName',{required:'Required'})} />
            {errors.bankName && <p className="text-sm text-red-600 mt-1">{errors.bankName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount</label>
            <input type="number" step="0.01" className="mt-1 w-full rounded-md border-gray-300" {...register('amount',{required:'Required', min:{value:0, message:'>= 0'}})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Interest Rate (%)</label>
            <input type="number" step="0.01" className="mt-1 w-full rounded-md border-gray-300" {...register('interestRate',{required:'Required', min:{value:0, message:'>= 0'}})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tenure</label>
            <input type="number" className="mt-1 w-full rounded-md border-gray-300" {...register('tenure',{required:'Required', min:{value:1, message:'>= 1'}})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tenure Type</label>
            <select className="mt-1 w-full rounded-md border-gray-300" {...register('tenureType',{required:'Required'})}>
              <option value="days">Days</option>
              <option value="months">Months</option>
              <option value="years">Years</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input type="date" className="mt-1 w-full rounded-md border-gray-300" {...register('startDate',{required:'Required'})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">FD Number</label>
            <input className="mt-1 w-full rounded-md border-gray-300" {...register('fdNumber',{required:'Required'})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Interest Payout</label>
            <select className="mt-1 w-full rounded-md border-gray-300" {...register('interestPayout')}>
              <option value="at_maturity">At Maturity</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>
          <div className="md:col-span-3 flex justify-end">
            <button type="submit" className="px-4 py-2 rounded-md text-white bg-primary-600 hover:bg-primary-700">Save</button>
          </div>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Fixed Deposits</h3>
        {loading ? (
          <p>Loading...</p>
        ) : fds.length === 0 ? (
          <p className="text-gray-500">No fixed deposits yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Bank</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">FD Number</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fds.map(fd => (
                  <tr key={fd._id}>
                    <td className="px-4 py-2 text-sm">{fd.bankName}</td>
                    <td className="px-4 py-2 text-sm">{fd.fdNumber}</td>
                    <td className="px-4 py-2 text-sm text-right">{new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(fd.amount)}</td>
                    <td className="px-4 py-2 text-sm text-right">
                      <button onClick={() => handleDelete(fd._id)} className="px-3 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100">Delete</button>
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

export default FixedDepositManagement;
