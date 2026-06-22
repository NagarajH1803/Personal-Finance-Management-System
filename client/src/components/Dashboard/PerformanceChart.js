import React from 'react';

const PerformanceChart = ({ data }) => {
  return (
    <div className="card">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Investment Performance</h3>
      <div className="text-center py-8">
        <div className="text-gray-400 text-sm">
          Performance chart will be displayed here
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Line chart showing investment returns over time
        </p>
      </div>
    </div>
  );
};

export default PerformanceChart;
