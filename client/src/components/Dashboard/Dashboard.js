import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import OverviewCards from './OverviewCards';
import FinancialSummary from './FinancialSummary';
import UpcomingPayments from './UpcomingPayments';
import AssetAllocation from './AssetAllocation';
import PerformanceChart from './PerformanceChart';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();

    const onDataChanged = () => {
      fetchDashboardData();
    };
    window.addEventListener('finance:data-changed', onDataChanged);

    return () => window.removeEventListener('finance:data-changed', onDataChanged);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const ts = Date.now();
      const [overview, cashflow, upcoming, performance, allocation] = await Promise.all([
        api.get(`/api/dashboard/overview?t=${ts}`),
        api.get(`/api/dashboard/cashflow?t=${ts}`),
        api.get(`/api/dashboard/upcoming?t=${ts}`),
        api.get(`/api/dashboard/performance?t=${ts}`),
        api.get(`/api/dashboard/allocation?t=${ts}`),
      ]);

      setDashboardData({
        overview: overview.data.data,
        cashflow: cashflow.data.data,
        upcoming: upcoming.data.data,
        performance: performance.data.data,
        allocation: allocation.data.data,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Failed to load dashboard</h3>
        <p className="text-gray-500">Please try refreshing the page</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your financial overview.</p>
      </div>

      {/* Overview Cards */}
      <OverviewCards data={dashboardData.overview} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial Summary */}
        <div className="lg:col-span-2">
          <FinancialSummary 
            overview={dashboardData.overview}
            cashflow={dashboardData.cashflow}
          />
        </div>

        {/* Upcoming Payments */}
        <div>
          <UpcomingPayments data={dashboardData.upcoming} />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Allocation */}
        <div>
          <AssetAllocation data={dashboardData.allocation} />
        </div>

        {/* Performance Chart */}
        <div>
          <PerformanceChart data={dashboardData.performance} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
