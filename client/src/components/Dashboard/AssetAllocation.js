import React, { useMemo } from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const AssetAllocation = ({ data }) => {
  const labels = useMemo(() => (
    ['Real Estate', 'Vehicles', 'Stocks', 'Fixed Deposits', 'Gold', 'Crypto', 'Other']
  ), []);

  const values = useMemo(() => {
    const a = data?.allocation || {};
    return [
      a.realEstate?.value || 0,
      a.vehicles?.value || 0,
      a.stocks?.value || 0,
      a.fixedDeposits?.value || 0,
      a.gold?.value || 0,
      a.crypto?.value || 0,
      a.other?.value || 0
    ];
  }, [data]);

  const chartData = useMemo(() => ({
    labels,
    datasets: [
      {
        label: 'Value (₹)',
        data: values,
        backgroundColor: [
          '#0ea5e9', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#64748b'
        ],
        borderWidth: 1
      }
    ]
  }), [labels, values]);

  const total = values.reduce((s, v) => s + v, 0);

  return (
    <div className="card">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Asset Allocation</h3>
      {total === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-sm">No portfolio data yet</div>
          <p className="text-xs text-gray-500 mt-2">Add assets, stocks, FDs, etc. to see the chart</p>
        </div>
      ) : (
        <div className="p-2">
          <Pie data={chartData} />
        </div>
      )}
    </div>
  );
};

export default AssetAllocation;
