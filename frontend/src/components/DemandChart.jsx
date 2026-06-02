import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const DemandChart = ({ data }) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Demand vs Supply Analysis</h3>
        <p className="text-gray-500 text-center py-8">No demand data available</p>
      </div>
    );
  }

  const formatQuantity = (value) => {
    return `${value} quintals`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Demand vs Supply Analysis</h3>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              stroke="#666"
              fontSize={12}
            />
            <YAxis 
              tickFormatter={(value) => `${value}`}
              stroke="#666"
              fontSize={12}
            />
            <Tooltip 
              formatter={(value, name) => [formatQuantity(value), name]}
              labelFormatter={(label) => formatDate(label)}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #ccc',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar 
              dataKey="demand" 
              fill="#3b82f6" 
              name="Demand"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="supply" 
              fill="#22c55e" 
              name="Supply"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-sm text-blue-600 font-medium">Total Demand</p>
          <p className="text-lg font-semibold text-blue-700">
            {data.reduce((sum, d) => sum + d.demand, 0)} quintals
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-sm text-green-600 font-medium">Total Supply</p>
          <p className="text-lg font-semibold text-green-700">
            {data.reduce((sum, d) => sum + d.supply, 0)} quintals
          </p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <p className="text-sm text-purple-600 font-medium">Market Gap</p>
          <p className="text-lg font-semibold text-purple-700">
            {Math.abs(data.reduce((sum, d) => sum + d.demand, 0) - data.reduce((sum, d) => sum + d.supply, 0))} quintals
          </p>
        </div>
      </div>

      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Market Insights</h4>
        <div className="space-y-2">
          {data.map((item, index) => {
            const gap = item.demand - item.supply;
            return (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-gray-600">{formatDate(item.date)}</span>
                <span className={`font-medium ${
                  gap > 0 ? 'text-red-600' : gap < 0 ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {gap > 0 ? `Shortage: ${gap} quintals` : 
                   gap < 0 ? `Surplus: ${Math.abs(gap)} quintals` : 
                   'Balanced'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DemandChart;
