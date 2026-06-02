import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const FeatureImportanceChart = ({ featureData, title = "Feature Importance Distribution" }) => {
  if (!featureData || !Array.isArray(featureData) || featureData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <p className="text-gray-500 text-center py-8">No feature importance data available</p>
      </div>
    );
  }

  // Prepare data for pie chart
  const pieData = featureData
    .filter(feature => feature.importance > 0.01) // Filter out very small values
    .slice(0, 8) // Top 8 features
    .map(feature => ({
      name: feature.feature.length > 20 ? feature.feature.substring(0, 20) + '...' : feature.feature,
      fullName: feature.feature,
      value: feature.importance,
      percentage: (feature.importance * 100).toFixed(1)
    }));

  const COLORS = [
    '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
  ];

  const formatTooltip = (data) => {
    if (data && data.payload) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{data.payload.fullName}</p>
          <p className="text-sm text-gray-600">
            Importance: {data.payload.percentage}%
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    if (percentage < 5) return null; // Don't show label for very small slices

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${percentage}%`}
      </text>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(props) => <CustomLabel {...props} percentage={parseFloat(props.payload.percentage)} />}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={formatTooltip} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value, entry) => (
                <span className="text-xs text-gray-600">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Top Influencing Factors</h4>
        <div className="space-y-2">
          {pieData.slice(0, 5).map((feature, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></div>
                <span className="text-sm text-gray-700">{feature.fullName}</span>
              </div>
              <span className="text-sm font-semibold text-gray-800">{feature.percentage}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">Model Insights</h4>
        <p className="text-sm text-blue-700">
          The top {pieData.length} features account for {pieData.reduce((sum, f) => sum + parseFloat(f.percentage), 0).toFixed(1)}% 
          of the model's decision-making process.
        </p>
        {pieData.length > 0 && (
          <p className="text-sm text-blue-700 mt-1">
            Most important factor: <span className="font-semibold">{pieData[0].fullName}</span> ({pieData[0].percentage}%)
          </p>
        )}
      </div>
    </div>
  );
};

export default FeatureImportanceChart;
