import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const FeatureImportanceChart = ({ featureImportance }) => {
  if (!featureImportance || featureImportance.length === 0) {
    return <div className="text-gray-500">No feature importance data available</div>;
  }

  // Sort by importance (descending) and take top 10
  const sortedData = [...featureImportance]
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 10)
    .reverse(); // Reverse for horizontal bar chart

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Feature Importance</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sortedData} layout="vertical" margin={{ left: 80 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" domain={[0, 'auto']} tickFormatter={(val) => val.toFixed(2)} />
            <YAxis type="category" dataKey="feature" width={70} />
            <Tooltip 
              formatter={(value) => [value.toFixed(4), 'Importance']}
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd' }}
            />
            <Bar dataKey="importance" fill="#4f46e5" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FeatureImportanceChart;
