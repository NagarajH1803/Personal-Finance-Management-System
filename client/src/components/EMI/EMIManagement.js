import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const EMIManagement = () => {
  const [emis, setEmis] = useState([]);
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchEmis = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/emi');
      setEmis(res.data.data);
    } catch (e) {
      toast.error('Failed to fetch EMIs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmis();
  }, []);

  const onSubmit = async (data) => {
    try {
      await api.post('/api/emi', data);
      toast.success('EMI added');
      reset();
      fetchEmis();
      window.dispatchEvent(new Event('finance:data-changed'));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to add EMI');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this EMI?')) return;
    try {
      await api.delete(`/api/emi/${id}`);
      toast.success('EMI deleted');
      fetchEmis();
      window.dispatchEvent(new Event('finance:data-changed'));
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">EMI Management</h1>
        <p className="text-gray-600">Manage your loan EMIs and track payments.</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add EMI</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">EMI Product/Title</label>
            <input className="mt-1 w-full rounded-md border-gray-300" {...register('title',{required:'Required'})} />
            {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Lender</label>
            <input className="mt-1 w-full rounded-md border-gray-300" {...register('lender',{required:'Required'})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Loan Amount</label>
            <input type="number" step="0.01" className="mt-1 w-full rounded-md border-gray-300" {...register('loanAmount',{required:'Required', min:{value:0, message:'>= 0'}})} />
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
              <option value="months">Months</option>
              <option value="years">Years</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">EMI Deduction Day (1-31)</label>
            <input type="number" className="mt-1 w-full rounded-md border-gray-300" {...register('emiDate',{required:'Required', min:{value:1, message:'>=1'}, max:{value:31, message:'<=31'}})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">EMI Start Date</label>
            <input type="date" className="mt-1 w-full rounded-md border-gray-300" {...register('startDate',{required:'Required'})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Loan Type</label>
            <select className="mt-1 w-full rounded-md border-gray-300" {...register('loanType')}>
              <option value="other">Other</option>
              <option value="home">Home</option>
              <option value="car">Car</option>
              <option value="personal">Personal</option>
              <option value="business">Business</option>
              <option value="education">Education</option>
            </select>
          </div>
          <div className="md:col-span-3 flex justify-end">
            <button type="submit" className="px-4 py-2 rounded-md text-white bg-primary-600 hover:bg-primary-700">Save</button>
          </div>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">EMIs</h3>
        {loading ? (
          <p>Loading...</p>
        ) : emis.length === 0 ? (
          <p className="text-gray-500">No EMIs yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Lender</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Start</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">End</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Deduct Day</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">EMI</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {emis.map(e => (
                  <tr key={e._id}>
                    <td className="px-4 py-2 text-sm">{e.title}</td>
                    <td className="px-4 py-2 text-sm">{e.lender}</td>
                    <td className="px-4 py-2 text-sm">{new Date(e.startDate).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-sm">{new Date(e.endDate).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-sm">{e.emiDate}</td>
                    <td className="px-4 py-2 text-sm text-right">{new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(e.emiAmount)}</td>
                    <td className="px-4 py-2 text-sm text-right">
                      <button onClick={() => handleDelete(e._id)} className="px-3 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100">Delete</button>
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

export default EMIManagement;
