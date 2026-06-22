import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

const FinancialSummary = ({ overview, cashflow }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div className="card">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Summary</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Assets Breakdown */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Assets Breakdown</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Real Estate</span>
              <span className="text-sm font-medium">{formatCurrency(overview.assets.realEstate)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Vehicles</span>
              <span className="text-sm font-medium">{formatCurrency(overview.assets.vehicles)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Stocks</span>
              <span className="text-sm font-medium">{formatCurrency(overview.assets.stocks)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Fixed Deposits</span>
              <span className="text-sm font-medium">{formatCurrency(overview.assets.fixedDeposits)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Gold</span>
              <span className="text-sm font-medium">{formatCurrency(overview.assets.gold)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Other</span>
              <span className="text-sm font-medium">{formatCurrency(overview.assets.other)}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">Total Assets</span>
                <span className="text-sm font-bold text-gray-900">{formatCurrency(overview.netWorth.assets)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Liabilities & Cash Flow */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Liabilities & Cash Flow</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">EMI Outstanding</span>
              <span className="text-sm font-medium text-danger-600">{formatCurrency(overview.liabilities.emiOutstanding)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Monthly EMI</span>
              <span className="text-sm font-medium">{formatCurrency(overview.liabilities.monthlyEMI)}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">Net Worth</span>
                <span className={`text-sm font-bold ${overview.netWorth.total >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                  {formatCurrency(overview.netWorth.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Monthly Cash Flow */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Monthly Cash Flow</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Income</span>
                <span className="text-sm font-medium text-success-600">{formatCurrency(cashflow.income.total)}</span>
              </div>
                          <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Rent Expenses</span>
              <span className="text-sm font-medium text-danger-600">{formatCurrency(cashflow.expenses.rent)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">EMI Payments</span>
              <span className="text-sm font-medium text-danger-600">{formatCurrency(cashflow.expenses.emi)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">General Expenses</span>
              <span className="text-sm font-medium text-danger-600">{formatCurrency(cashflow.expenses.general)}</span>
            </div>
              <div className="border-t pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">Net Cash Flow</span>
                  <span className={`text-sm font-bold flex items-center ${cashflow.netCashflow >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                    {cashflow.netCashflow >= 0 ? (
                      <ArrowUpIcon className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowDownIcon className="h-4 w-4 mr-1" />
                    )}
                    {formatCurrency(Math.abs(cashflow.netCashflow))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialSummary;
