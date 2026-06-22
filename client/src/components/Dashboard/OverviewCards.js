import React from 'react';
import {
  BanknotesIcon,
  CreditCardIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

const OverviewCards = ({ data }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const cards = [
    {
      name: 'Net Worth',
      value: formatCurrency(data.netWorth.total),
      change: data.netWorth.total > 0 ? '+12.5%' : '-2.3%',
      changeType: data.netWorth.total > 0 ? 'positive' : 'negative',
      icon: BanknotesIcon,
      description: 'Total assets minus liabilities',
    },
    {
      name: 'Total Assets',
      value: formatCurrency(data.netWorth.assets),
      change: '+8.2%',
      changeType: 'positive',
      icon: BuildingOfficeIcon,
      description: 'Combined value of all assets',
    },
    {
      name: 'Monthly EMI',
      value: formatCurrency(data.liabilities.monthlyEMI),
      change: '0%',
      changeType: 'neutral',
      icon: CreditCardIcon,
      description: 'Total monthly EMI payments',
    },
    {
      name: 'Monthly Expenses',
      value: formatCurrency(data.expenses.total),
      change: '+5.2%',
      changeType: 'negative',
      icon: CurrencyDollarIcon,
      description: 'Total monthly expenses',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.name} className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <card.icon className="h-8 w-8 text-gray-400" aria-hidden="true" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  {card.name}
                </dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900">
                    {card.value}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{card.description}</span>
              <span
                className={`text-sm font-medium ${
                  card.changeType === 'positive'
                    ? 'text-success-600'
                    : card.changeType === 'negative'
                    ? 'text-danger-600'
                    : 'text-gray-500'
                }`}
              >
                {card.change}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OverviewCards;
