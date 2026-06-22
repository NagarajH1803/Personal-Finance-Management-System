import React from 'react';
import { CalendarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const UpcomingPayments = ({ data }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getPriorityColor = (daysUntilDue) => {
    if (daysUntilDue <= 3) return 'text-danger-600 bg-danger-50';
    if (daysUntilDue <= 7) return 'text-warning-600 bg-warning-50';
    return 'text-success-600 bg-success-50';
  };

  const getPriorityIcon = (daysUntilDue) => {
    if (daysUntilDue <= 3) return <ExclamationTriangleIcon className="h-4 w-4" />;
    return <CalendarIcon className="h-4 w-4" />;
  };

  const upcomingItems = data.upcoming || [];

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Upcoming Payments</h3>
        <span className="text-sm text-gray-500">
          {upcomingItems.length} items
        </span>
      </div>

      {upcomingItems.length === 0 ? (
        <div className="text-center py-8">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming payments</h3>
          <p className="mt-1 text-sm text-gray-500">
            You're all caught up with your payments.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {upcomingItems.slice(0, 5).map((item, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg border ${getPriorityColor(item.daysUntilDue)}`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${getPriorityColor(item.daysUntilDue).replace('text-', 'bg-').replace('bg-danger-600', 'bg-danger-100').replace('bg-warning-600', 'bg-warning-100').replace('bg-success-600', 'bg-success-100')}`}>
                  {getPriorityIcon(item.daysUntilDue)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.type}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {formatCurrency(item.amount)}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDate(item.dueDate)}
                </p>
                <p className={`text-xs font-medium ${getPriorityColor(item.daysUntilDue).split(' ')[0]}`}>
                  {item.daysUntilDue} days
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {upcomingItems.length > 5 && (
        <div className="mt-4 text-center">
          <button className="text-sm text-primary-600 hover:text-primary-500 font-medium">
            View all {upcomingItems.length} items
          </button>
        </div>
      )}
    </div>
  );
};

export default UpcomingPayments;
