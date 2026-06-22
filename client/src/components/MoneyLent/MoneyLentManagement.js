import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const MoneyLentManagement = () => {
  const [moneyLent, setMoneyLent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const { register: registerPayment, handleSubmit: handlePaymentSubmit, reset: resetPayment, formState: { errors: paymentErrors } } = useForm();

  const paymentSchedules = ['lump_sum', 'monthly', 'quarterly', 'yearly', 'custom'];
  const statuses = ['active', 'partially_paid', 'paid', 'overdue', 'defaulted'];

  const fetchMoneyLent = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/money-lent');
      setMoneyLent(res.data.data);
    } catch (e) {
      toast.error('Failed to fetch money lent records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMoneyLent();
  }, []);

  const onSubmit = async (data) => {
    try {
      await api.post('/api/money-lent', data);
      toast.success('Money lent record added');
      reset();
      fetchMoneyLent();
      window.dispatchEvent(new Event('finance:data-changed'));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to add money lent record');
    }
  };

  const onPaymentSubmit = async (data) => {
    try {
      await api.post(`/api/money-lent/${selectedLoan._id}/payments`, data);
      toast.success('Payment recorded');
      resetPayment();
      setShowPaymentForm(false);
      setSelectedLoan(null);
      fetchMoneyLent();
      window.dispatchEvent(new Event('finance:data-changed'));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to record payment');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this money lent record?')) return;
    try {
      await api.delete(`/api/money-lent/${id}`);
      toast.success('Money lent record deleted');
      fetchMoneyLent();
      window.dispatchEvent(new Event('finance:data-changed'));
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  const openPaymentForm = (loan) => {
    setSelectedLoan(loan);
    setShowPaymentForm(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      partially_paid: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-blue-100 text-blue-800',
      overdue: 'bg-red-100 text-red-800',
      defaulted: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Money Lent Management</h1>
        <p className="text-gray-600">Track money you've lent to others and manage repayments.</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add Money Lent Record</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Borrower Name</label>
            <input 
              className="mt-1 w-full rounded-md border-gray-300" 
              {...register('borrowerName', { required: 'Borrower name is required' })} 
            />
            {errors.borrowerName && <p className="text-sm text-red-600 mt-1">{errors.borrowerName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount</label>
            <input 
              type="number" 
              step="0.01" 
              className="mt-1 w-full rounded-md border-gray-300" 
              {...register('amount', { required: 'Amount is required', min: { value: 0, message: 'Must be >= 0' } })} 
            />
            {errors.amount && <p className="text-sm text-red-600 mt-1">{errors.amount.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Interest Rate (%)</label>
            <input 
              type="number" 
              step="0.01" 
              className="mt-1 w-full rounded-md border-gray-300" 
              {...register('interestRate', { min: { value: 0, message: 'Must be >= 0' }, max: { value: 100, message: 'Must be <= 100' } })} 
            />
            {errors.interestRate && <p className="text-sm text-red-600 mt-1">{errors.interestRate.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Loan Date</label>
            <input 
              type="date" 
              className="mt-1 w-full rounded-md border-gray-300" 
              {...register('loanDate', { required: 'Loan date is required' })} 
            />
            {errors.loanDate && <p className="text-sm text-red-600 mt-1">{errors.loanDate.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Due Date</label>
            <input 
              type="date" 
              className="mt-1 w-full rounded-md border-gray-300" 
              {...register('dueDate', { required: 'Due date is required' })} 
            />
            {errors.dueDate && <p className="text-sm text-red-600 mt-1">{errors.dueDate.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Schedule</label>
            <select 
              className="mt-1 w-full rounded-md border-gray-300" 
              {...register('paymentSchedule', { required: 'Payment schedule is required' })}
            >
              <option value="">Select</option>
              {paymentSchedules.map(schedule => (
                <option key={schedule} value={schedule}>
                  {schedule.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
            {errors.paymentSchedule && <p className="text-sm text-red-600 mt-1">{errors.paymentSchedule.message}</p>}
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea 
              className="mt-1 w-full rounded-md border-gray-300" 
              rows="3"
              {...register('notes')} 
            />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <button type="submit" className="px-4 py-2 rounded-md text-white bg-primary-600 hover:bg-primary-700">
              Save
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Money Lent Records</h3>
        {loading ? (
          <p>Loading...</p>
        ) : moneyLent.length === 0 ? (
          <p className="text-gray-500">No money lent records yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Borrower</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Paid</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Remaining</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {moneyLent.map(loan => (
                  <tr key={loan._id}>
                    <td className="px-4 py-2 text-sm font-medium">{loan.borrowerName}</td>
                    <td className="px-4 py-2 text-sm text-right">{formatCurrency(loan.amount)}</td>
                    <td className="px-4 py-2 text-sm text-right">{formatCurrency(loan.totalPaid)}</td>
                    <td className="px-4 py-2 text-sm text-right">{formatCurrency(loan.remainingBalance)}</td>
                    <td className="px-4 py-2 text-sm text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(loan.status)}`}>
                        {loan.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-center">
                      {new Date(loan.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-sm text-center space-x-2">
                      <button 
                        onClick={() => openPaymentForm(loan)} 
                        className="px-3 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
                      >
                        Add Payment
                      </button>
                      <button 
                        onClick={() => handleDelete(loan._id)} 
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

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Add Payment for {selectedLoan?.borrowerName}
              </h3>
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Date</label>
                  <input 
                    type="date" 
                    className="mt-1 w-full rounded-md border-gray-300" 
                    {...registerPayment('date', { required: 'Payment date is required' })} 
                  />
                  {paymentErrors.date && <p className="text-sm text-red-600 mt-1">{paymentErrors.date.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="mt-1 w-full rounded-md border-gray-300" 
                    {...registerPayment('amount', { required: 'Amount is required', min: { value: 0, message: 'Must be >= 0' } })} 
                  />
                  {paymentErrors.amount && <p className="text-sm text-red-600 mt-1">{paymentErrors.amount.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Principal</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="mt-1 w-full rounded-md border-gray-300" 
                    {...registerPayment('principal', { required: 'Principal is required', min: { value: 0, message: 'Must be >= 0' } })} 
                  />
                  {paymentErrors.principal && <p className="text-sm text-red-600 mt-1">{paymentErrors.principal.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Interest</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="mt-1 w-full rounded-md border-gray-300" 
                    {...registerPayment('interest', { required: 'Interest is required', min: { value: 0, message: 'Must be >= 0' } })} 
                  />
                  {paymentErrors.interest && <p className="text-sm text-red-600 mt-1">{paymentErrors.interest.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea 
                    className="mt-1 w-full rounded-md border-gray-300" 
                    rows="2"
                    {...registerPayment('notes')} 
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowPaymentForm(false);
                      setSelectedLoan(null);
                      resetPayment();
                    }}
                    className="px-4 py-2 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 rounded-md text-white bg-primary-600 hover:bg-primary-700">
                    Record Payment
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

export default MoneyLentManagement;
