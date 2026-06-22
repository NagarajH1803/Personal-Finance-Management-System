import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const ITRManagement = () => {
  const [itrRecords, setItrRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoCalculating, setAutoCalculating] = useState(false);
  const [financialYear, setFinancialYear] = useState('');
  const [selectedITR, setSelectedITR] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  // Generate financial year options
  const currentYear = new Date().getFullYear();
  const financialYears = [];
  for (let i = currentYear - 2; i <= currentYear + 1; i++) {
    financialYears.push(`${i}-${i + 1}`);
  }

  useEffect(() => {
    fetchITRRecords();
  }, []);

  const fetchITRRecords = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/itr');
      setItrRecords(response.data.data || []);
    } catch (error) {
      console.error('Error fetching ITR records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoCalculate = async () => {
    if (!financialYear) {
      alert('Please select a financial year');
      return;
    }

    try {
      setAutoCalculating(true);
      const response = await api.post('/api/itr/auto-calculate', {
        financialYear
      });
      
      if (response.data.success) {
        alert('ITR auto-calculated successfully!');
        fetchITRRecords();
        setSelectedITR(response.data.data);
        setShowForm(true);
      }
    } catch (error) {
      console.error('Error auto-calculating ITR:', error);
      alert('Error auto-calculating ITR. Please try again.');
    } finally {
      setAutoCalculating(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
    setEditData({
      income: { ...selectedITR.income },
      deductions: { ...selectedITR.deductions },
      taxesPaid: { ...selectedITR.taxesPaid }
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await api.put(`/api/itr/${selectedITR._id}`, editData);
      
      if (response.data.success) {
        setSelectedITR(response.data.data);
        setEditing(false);
        fetchITRRecords();
        alert('ITR updated successfully!');
      }
    } catch (error) {
      console.error('Error updating ITR:', error);
      alert('Error updating ITR. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setEditData({});
  };

  const handleRecalculate = async () => {
    try {
      setSaving(true);
      const response = await api.post(`/api/itr/${selectedITR._id}/recalculate`);
      
      if (response.data.success) {
        setSelectedITR(response.data.data);
        fetchITRRecords();
        alert('ITR recalculated successfully!');
      }
    } catch (error) {
      console.error('Error recalculating ITR:', error);
      alert('Error recalculating ITR. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-yellow-100 text-yellow-800',
      filed: 'bg-blue-100 text-blue-800',
      verified: 'bg-green-100 text-green-800',
      processed: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Income Tax Return</h1>
          <p className="text-gray-600">Manage your income tax returns with automatic calculations.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Hide Form' : 'Create New ITR'}
        </button>
      </div>

      {/* Auto Calculate Section */}
      <div className="card">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Auto-Calculate ITR</h3>
          <p className="text-gray-600 mb-4">
            Automatically calculate your ITR based on your financial data from assets, expenses, investments, and other modules.
          </p>
          
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Financial Year
              </label>
              <select
                value={financialYear}
                onChange={(e) => setFinancialYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Financial Year</option>
                {financialYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAutoCalculate}
              disabled={autoCalculating || !financialYear}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {autoCalculating ? 'Calculating...' : 'Auto-Calculate'}
            </button>
          </div>
        </div>
      </div>

      {/* ITR Records List */}
      <div className="card">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ITR Records</h3>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading ITR records...</p>
            </div>
          ) : itrRecords.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No ITR records found. Create your first ITR using auto-calculation.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {itrRecords.map((itr) => (
                <div key={itr._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900">
                          Financial Year: {itr.financialYear}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(itr.status)}`}>
                          {itr.status.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Total Income</p>
                          <p className="font-semibold text-green-600">
                            {formatCurrency(itr.income?.total || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Taxable Income</p>
                          <p className="font-semibold text-blue-600">
                            {formatCurrency(itr.taxCalculation?.taxableIncome || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Total Tax</p>
                          <p className="font-semibold text-red-600">
                            {formatCurrency(itr.taxCalculation?.totalTax || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Refund</p>
                          <p className="font-semibold text-green-600">
                            {formatCurrency(itr.refund?.amount || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        setSelectedITR(itr);
                        setShowForm(true);
                      }}
                      className="ml-4 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ITR Details Form */}
      {showForm && selectedITR && (
        <div className="card">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                ITR Details - {selectedITR.financialYear}
              </h3>
              <div className="flex gap-2">
                {!editing ? (
                  <>
                    <button
                      onClick={handleEdit}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleRecalculate}
                      disabled={saving}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      {saving ? 'Recalculating...' : 'Recalculate Tax'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Income Details */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 border-b pb-2">Income Details</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Salary:</span>
                    {editing ? (
                      <input
                        type="number"
                        value={editData.income?.salary || 0}
                        onChange={(e) => setEditData({
                          ...editData,
                          income: { ...editData.income, salary: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-32 px-2 py-1 border border-gray-300 rounded text-right"
                      />
                    ) : (
                      <span className="font-semibold">{formatCurrency(selectedITR.income?.salary || 0)}</span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Business:</span>
                    {editing ? (
                      <input
                        type="number"
                        value={editData.income?.business || 0}
                        onChange={(e) => setEditData({
                          ...editData,
                          income: { ...editData.income, business: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-32 px-2 py-1 border border-gray-300 rounded text-right"
                      />
                    ) : (
                      <span className="font-semibold">{formatCurrency(selectedITR.income?.business || 0)}</span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">House Property:</span>
                    {editing ? (
                      <input
                        type="number"
                        value={editData.income?.houseProperty || 0}
                        onChange={(e) => setEditData({
                          ...editData,
                          income: { ...editData.income, houseProperty: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-32 px-2 py-1 border border-gray-300 rounded text-right"
                      />
                    ) : (
                      <span className="font-semibold">{formatCurrency(selectedITR.income?.houseProperty || 0)}</span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Capital Gains:</span>
                    {editing ? (
                      <input
                        type="number"
                        value={editData.income?.capitalGains || 0}
                        onChange={(e) => setEditData({
                          ...editData,
                          income: { ...editData.income, capitalGains: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-32 px-2 py-1 border border-gray-300 rounded text-right"
                      />
                    ) : (
                      <span className="font-semibold">{formatCurrency(selectedITR.income?.capitalGains || 0)}</span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Other Sources:</span>
                    {editing ? (
                      <input
                        type="number"
                        value={editData.income?.otherSources || 0}
                        onChange={(e) => setEditData({
                          ...editData,
                          income: { ...editData.income, otherSources: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-32 px-2 py-1 border border-gray-300 rounded text-right"
                      />
                    ) : (
                      <span className="font-semibold">{formatCurrency(selectedITR.income?.otherSources || 0)}</span>
                    )}
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-900 font-semibold">Total Income:</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(editing ? 
                        (editData.income?.salary || 0) + (editData.income?.business || 0) + 
                        (editData.income?.houseProperty || 0) + (editData.income?.capitalGains || 0) + 
                        (editData.income?.otherSources || 0) : 
                        selectedITR.income?.total || 0
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 border-b pb-2">Deductions</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Section 80C:</span>
                    {editing ? (
                      <input
                        type="number"
                        value={editData.deductions?.section80C || 0}
                        onChange={(e) => setEditData({
                          ...editData,
                          deductions: { ...editData.deductions, section80C: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-32 px-2 py-1 border border-gray-300 rounded text-right"
                      />
                    ) : (
                      <span className="font-semibold">{formatCurrency(selectedITR.deductions?.section80C || 0)}</span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Section 80D:</span>
                    {editing ? (
                      <input
                        type="number"
                        value={editData.deductions?.section80D || 0}
                        onChange={(e) => setEditData({
                          ...editData,
                          deductions: { ...editData.deductions, section80D: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-32 px-2 py-1 border border-gray-300 rounded text-right"
                      />
                    ) : (
                      <span className="font-semibold">{formatCurrency(selectedITR.deductions?.section80D || 0)}</span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Section 80G:</span>
                    {editing ? (
                      <input
                        type="number"
                        value={editData.deductions?.section80G || 0}
                        onChange={(e) => setEditData({
                          ...editData,
                          deductions: { ...editData.deductions, section80G: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-32 px-2 py-1 border border-gray-300 rounded text-right"
                      />
                    ) : (
                      <span className="font-semibold">{formatCurrency(selectedITR.deductions?.section80G || 0)}</span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">HRA:</span>
                    {editing ? (
                      <input
                        type="number"
                        value={editData.deductions?.hra || 0}
                        onChange={(e) => setEditData({
                          ...editData,
                          deductions: { ...editData.deductions, hra: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-32 px-2 py-1 border border-gray-300 rounded text-right"
                      />
                    ) : (
                      <span className="font-semibold">{formatCurrency(selectedITR.deductions?.hra || 0)}</span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Standard Deduction:</span>
                    {editing ? (
                      <input
                        type="number"
                        value={editData.deductions?.standardDeduction || 0}
                        onChange={(e) => setEditData({
                          ...editData,
                          deductions: { ...editData.deductions, standardDeduction: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-32 px-2 py-1 border border-gray-300 rounded text-right"
                      />
                    ) : (
                      <span className="font-semibold">{formatCurrency(selectedITR.deductions?.standardDeduction || 0)}</span>
                    )}
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-900 font-semibold">Total Deductions:</span>
                    <span className="font-bold text-blue-600">
                      {formatCurrency(editing ? 
                        (editData.deductions?.section80C || 0) + (editData.deductions?.section80D || 0) + 
                        (editData.deductions?.section80G || 0) + (editData.deductions?.hra || 0) + 
                        (editData.deductions?.standardDeduction || 0) : 
                        selectedITR.deductions?.total || 0
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tax Calculation */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 border-b pb-2">Tax Calculation</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Taxable Income:</span>
                    <span className="font-semibold">{formatCurrency(selectedITR.taxCalculation?.taxableIncome || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax Amount:</span>
                    <span className="font-semibold">{formatCurrency(selectedITR.taxCalculation?.taxAmount || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Surcharge:</span>
                    <span className="font-semibold">{formatCurrency(selectedITR.taxCalculation?.surcharge || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Education Cess:</span>
                    <span className="font-semibold">{formatCurrency(selectedITR.taxCalculation?.educationCess || 0)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-900 font-semibold">Total Tax:</span>
                    <span className="font-bold text-red-600">{formatCurrency(selectedITR.taxCalculation?.totalTax || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Refund/Liability */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 border-b pb-2">Refund/Liability</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">TDS:</span>
                    <span className="font-semibold">{formatCurrency(selectedITR.taxesPaid?.tds || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Advance Tax:</span>
                    <span className="font-semibold">{formatCurrency(selectedITR.taxesPaid?.advanceTax || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Self Assessment Tax:</span>
                    <span className="font-semibold">{formatCurrency(selectedITR.taxesPaid?.selfAssessmentTax || 0)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-900 font-semibold">
                      {selectedITR.refund?.amount > 0 ? 'Refund Amount:' : 'Tax Liability:'}
                    </span>
                    <span className={`font-bold ${selectedITR.refund?.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(Math.abs(selectedITR.refund?.amount || 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ITRManagement;
