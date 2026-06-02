import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PriceChart = ({ data }) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Price Trend Analysis</h3>
        <p className="text-gray-500 text-center py-8">No price trend data available</p>
      </div>
    );
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Price Trend Analysis</h3>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 5,
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
              tickFormatter={(value) => `Rs ${value}`}
              stroke="#666"
              fontSize={12}
            />
            <Tooltip 
              formatter={(value) => [formatCurrency(value), 'Price']}
              labelFormatter={(label) => formatDate(label)}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #ccc',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#22c55e" 
              strokeWidth={2}
              dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
              name="Predicted Price"
            />
            {data[0]?.historical_price && (
              <Line 
                type="monotone" 
                dataKey="historical_price" 
                stroke="#6b7280" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#6b7280', strokeWidth: 2, r: 3 }}
                name="Historical Price"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-sm text-gray-500">Min Price</p>
          <p className="text-lg font-semibold text-gray-800">
            {formatCurrency(Math.min(...data.map(d => d.price)))}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">Max Price</p>
          <p className="text-lg font-semibold text-gray-800">
            {formatCurrency(Math.max(...data.map(d => d.price)))}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">Avg Price</p>
          <p className="text-lg font-semibold text-gray-800">
            {formatCurrency(Math.round(data.reduce((sum, d) => sum + d.price, 0) / data.length))}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">Trend</p>
          <p className="text-lg font-semibold text-green-600">
            {data[data.length - 1].price > data[0].price ? 'Rising' : 'Falling'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PriceChart;
