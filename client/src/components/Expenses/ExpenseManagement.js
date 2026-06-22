import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  TagIcon,
  CreditCardIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import api from '../../utils/api';

const ExpenseManagement = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    category: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    paymentMethod: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });

  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm();
  const isRecurring = watch('isRecurring');

  const categories = [
    'Food & Dining', 'Transportation', 'Housing & Rent', 'Utilities', 'Healthcare',
    'Entertainment', 'Shopping', 'Education', 'Insurance', 'Taxes', 'Travel',
    'Personal Care', 'Gifts & Donations', 'Business', 'Investment', 'Debt Payment',
    'Emergency', 'Other'
  ];

  const paymentMethods = [
    'Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'UPI', 'Digital Wallet', 'Check', 'Other'
  ];

  const recurringTypes = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'];

  useEffect(() => {
    fetchExpenses();
    fetchStats();
  }, [filters, pagination.currentPage]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        ...filters
      });

      const response = await api.get(`/api/expenses?${params}`);
      setExpenses(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to fetch expenses');
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/expenses/stats/overview');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const onSubmit = async (data) => {
    try {
      if (editingExpense) {
        await api.put(`/api/expenses/${editingExpense._id}`, data);
        toast.success('Expense updated successfully');
      } else {
        await api.post('/api/expenses', data);
        toast.success('Expense added successfully');
      }
      
      reset();
      setShowForm(false);
      setEditingExpense(null);
      fetchExpenses();
      fetchStats();
      // Notify other pages (e.g., Dashboard) to refresh
      window.dispatchEvent(new Event('finance:data-changed'));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save expense');
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    reset({
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      subCategory: expense.subCategory,
      description: expense.description,
      date: expense.date.split('T')[0],
      paymentMethod: expense.paymentMethod,
      isRecurring: expense.isRecurring,
      recurringType: expense.recurringType,
      recurringEndDate: expense.recurringEndDate?.split('T')[0],
      tags: expense.tags,
      location: expense.location,
      vendor: expense.vendor,
      isTaxDeductible: expense.isTaxDeductible,
      status: expense.status,
      notes: expense.notes
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await api.delete(`/api/expenses/${id}`);
        toast.success('Expense deleted successfully');
        fetchExpenses();
        fetchStats();
        window.dispatchEvent(new Event('finance:data-changed'));
      } catch (error) {
        toast.error('Failed to delete expense');
      }
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Food & Dining': 'bg-orange-100 text-orange-800',
      'Transportation': 'bg-blue-100 text-blue-800',
      'Housing & Rent': 'bg-purple-100 text-purple-800',
      'Utilities': 'bg-yellow-100 text-yellow-800',
      'Healthcare': 'bg-red-100 text-red-800',
      'Entertainment': 'bg-pink-100 text-pink-800',
      'Shopping': 'bg-green-100 text-green-800',
      'Education': 'bg-indigo-100 text-indigo-800',
      'Insurance': 'bg-teal-100 text-teal-800',
      'Taxes': 'bg-gray-100 text-gray-800',
      'Travel': 'bg-cyan-100 text-cyan-800',
      'Personal Care': 'bg-rose-100 text-rose-800',
      'Gifts & Donations': 'bg-emerald-100 text-emerald-800',
      'Business': 'bg-slate-100 text-slate-800',
      'Investment': 'bg-violet-100 text-violet-800',
      'Debt Payment': 'bg-amber-100 text-amber-800',
      'Emergency': 'bg-red-100 text-red-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expense Management</h1>
          <p className="text-gray-600">Track and manage your daily expenses</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingExpense(null);
            reset();
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Expense
        </button>
      </div>

      {/* Add/Edit Expense Form */}
      {showForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">{editingExpense ? 'Edit Expense' : 'Add Expense'}</h3>
            <button onClick={() => { setShowForm(false); setEditingExpense(null); }} className="p-2 rounded hover:bg-gray-100">
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                {...register('title', { required: 'Title is required', maxLength: 100 })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="e.g., Grocery shopping"
              />
              {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Amount (INR)</label>
              <input
                type="number"
                step="0.01"
                {...register('amount', { required: 'Amount is required', min: { value: 0, message: 'Amount must be positive' } })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="0.00"
              />
              {errors.amount && <p className="text-sm text-red-600 mt-1">{errors.amount.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                {...register('category', { required: 'Category is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="">Select category</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.category && <p className="text-sm text-red-600 mt-1">{errors.category.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                {...register('date')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Payment Method</label>
              <select
                {...register('paymentMethod')}
                className="mt-1 block w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                {paymentMethods.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <input
                type="text"
                {...register('description')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="Optional notes"
              />
            </div>

            <div className="md:col-span-2 flex items-center space-x-4">
              <label className="inline-flex items-center">
                <input type="checkbox" {...register('isRecurring')} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                <span className="ml-2 text-sm text-gray-700">Recurring</span>
              </label>

              {isRecurring && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Recurring Type</label>
                    <select
                      {...register('recurringType')}
                      className="mt-1 block w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                      <option value="">Select type</option>
                      {recurringTypes.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Recurring End Date</label>
                    <input type="date" {...register('recurringEndDate')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
                  </div>
                </>
              )}
            </div>

            <div className="md:col-span-2 flex justify-end space-x-3 mt-2">
              <button type="button" onClick={() => { setShowForm(false); setEditingExpense(null); reset(); }} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-md text-white bg-primary-600 hover:bg-primary-700">{editingExpense ? 'Update' : 'Save'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Expenses</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(stats.overview?.totalExpenses || 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Average Expense</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(stats.overview?.averageExpense || 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TagIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Count</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.overview?.expenseCount || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowUpIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Highest Expense</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(stats.overview?.maxExpense || 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and table */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-end md:space-x-4 space-y-3 md:space-y-0 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Search</label>
            <div className="relative mt-1">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="block w-full rounded-md border-gray-300 pl-10 focus:border-primary-500 focus:ring-primary-500"
                placeholder="Search title, description, vendor..."
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select value={filters.category} onChange={(e) => handleFilterChange('category', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 bg-white focus:border-primary-500 focus:ring-primary-500">
              <option value="">All</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Min Amount</label>
            <input type="number" value={filters.minAmount} onChange={(e) => handleFilterChange('minAmount', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Max Amount</label>
            <input type="number" value={filters.maxAmount} onChange={(e) => handleFilterChange('maxAmount', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">Loading...</td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">No expenses found</td>
                </tr>
              ) : (
                expenses.map(expense => (
                  <tr key={expense._id}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{formatDate(expense.date)}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{expense.title}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getCategoryColor(expense.category)}`}>
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-900">{formatCurrency(expense.amount)}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm">
                      <div className="inline-flex space-x-2">
                        <button onClick={() => handleEdit(expense)} className="p-2 rounded hover:bg-gray-100" title="Edit">
                          <PencilIcon className="h-5 w-5 text-gray-600" />
                        </button>
                        <button onClick={() => handleDelete(expense._id)} className="p-2 rounded hover:bg-red-50" title="Delete">
                          <TrashIcon className="h-5 w-5 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExpenseManagement;
