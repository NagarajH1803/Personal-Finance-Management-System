import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const RentManagement = () => {
  const [rents, setRents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchRents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/rent');
      setRents(res.data.data || []);
    } catch (e) {
      toast.error('Failed to fetch rent records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRents();
  }, []);

  const onSubmit = async (data) => {
    try {
      const payload = {
        type: data.type,
        propertyName: data.propertyName,
        propertyType: data.propertyType,
        amount: Number(data.amount),
        dueDate: Number(data.dueDate),
        agreement: {
          startDate: data.startDate,
          endDate: data.endDate,
          securityDeposit: data.securityDeposit ? Number(data.securityDeposit) : 0,
          maintenanceCharges: data.maintenanceCharges ? Number(data.maintenanceCharges) : 0
        },
        tenant: {
          name: data.tenantName || '',
          phone: data.tenantPhone || ''
        },
        landlord: {
          name: data.landlordName || ''
        },
        status: 'active'
      };

      await api.post('/api/rent', payload);
      toast.success('Rent record added');
      reset();
      fetchRents();
      window.dispatchEvent(new Event('finance:data-changed'));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to add rent');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this rent record?')) return;
    try {
      await api.delete(`/api/rent/${id}`);
      toast.success('Rent deleted');
      fetchRents();
      window.dispatchEvent(new Event('finance:data-changed'));
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rent Management</h1>
        <p className="text-gray-600">Track your rental income and expenses.</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add Rent Record</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select className="mt-1 w-full rounded-md border-gray-300" {...register('type', { required: 'Type is required' })}>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            {errors.type && <p className="text-sm text-red-600 mt-1">{errors.type.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Property Name</label>
            <input className="mt-1 w-full rounded-md border-gray-300" {...register('propertyName', { required: 'Property name is required' })} />
            {errors.propertyName && <p className="text-sm text-red-600 mt-1">{errors.propertyName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Property Type</label>
            <select className="mt-1 w-full rounded-md border-gray-300" defaultValue="apartment" {...register('propertyType')}>
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="office">Office</option>
              <option value="shop">Shop</option>
              <option value="land">Land</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount (₹)</label>
            <input type="number" step="0.01" className="mt-1 w-full rounded-md border-gray-300" {...register('amount', { required: 'Amount is required', min: { value: 0, message: '>= 0' } })} />
            {errors.amount && <p className="text-sm text-red-600 mt-1">{errors.amount.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Due Date (1-31)</label>
            <input type="number" className="mt-1 w-full rounded-md border-gray-300" {...register('dueDate', { required: 'Due date is required', min: { value: 1, message: '1-31' }, max: { value: 31, message: '1-31' } })} />
            {errors.dueDate && <p className="text-sm text-red-600 mt-1">{errors.dueDate.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Agreement Start</label>
            <input type="date" className="mt-1 w-full rounded-md border-gray-300" {...register('startDate', { required: 'Start date required' })} />
            {errors.startDate && <p className="text-sm text-red-600 mt-1">{errors.startDate.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Agreement End</label>
            <input type="date" className="mt-1 w-full rounded-md border-gray-300" {...register('endDate', { required: 'End date required' })} />
            {errors.endDate && <p className="text-sm text-red-600 mt-1">{errors.endDate.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Security Deposit (₹)</label>
            <input type="number" step="0.01" className="mt-1 w-full rounded-md border-gray-300" {...register('securityDeposit')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Maintenance (₹)</label>
            <input type="number" step="0.01" className="mt-1 w-full rounded-md border-gray-300" {...register('maintenanceCharges')} />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <button type="submit" className="px-4 py-2 rounded-md text-white bg-primary-600 hover:bg-primary-700">Save</button>
          </div>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Rent Records</h3>
        {loading ? (
          <p>Loading...</p>
        ) : rents.length === 0 ? (
          <p className="text-gray-500">No rent records yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr></thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rents.map(r => (
                  <tr key={r._id}>
                    <td className="px-4 py-2 text-sm capitalize">{r.type}</td>
                    <td className="px-4 py-2 text-sm">{r.propertyName}</td>
                    <td className="px-4 py-2 text-sm">{r.dueDate}</td>
                    <td className="px-4 py-2 text-sm text-right">{new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(r.amount)}</td>
                    <td className="px-4 py-2 text-sm text-right">
                      <button onClick={() => handleDelete(r._id)} className="px-3 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100">Delete</button>
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

export default RentManagement;
