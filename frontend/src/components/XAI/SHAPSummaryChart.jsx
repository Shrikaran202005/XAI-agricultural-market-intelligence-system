import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const SHAPSummaryChart = ({ shapData }) => {
  // Check if data is available in either format
  const hasTopFeatures = shapData && shapData.top_features && shapData.top_features.length > 0;
  const hasShapValues = shapData && shapData.shap_values && shapData.feature_names;
  
  if (!hasTopFeatures && !hasShapValues) {
    return <div className="text-gray-500">No SHAP data available</div>;
  }

  // Prepare data for waterfall chart
  let data = [];
  if (hasTopFeatures) {
    data = shapData.top_features.slice(0, 10).map((item, index) => ({
      name: item.feature,
      value: item.importance,
      isPositive: item.importance >= 0,
      formattedValue: item.importance.toFixed(4)
    }));
  } else if (hasShapValues) {
    data = shapData.shap_values.map((value, index) => ({
      name: shapData.feature_names[index],
      value: value,
      isPositive: value >= 0,
      formattedValue: value.toFixed(4)
    })).slice(0, 10);
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">SHAP Feature Impact</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tickFormatter={(val) => val.toFixed(2)} />
            <YAxis type="category" dataKey="name" width={70} />
            <Tooltip 
              formatter={(value) => [value.toFixed(4), 'SHAP Value']}
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd' }}
            />
            <ReferenceLine x={0} stroke="#666" />
            <Bar 
              dataKey="value" 
              fill={(entry) => entry.isPositive ? '#10b981' : '#ef4444'}
              radius={[0, 4, 4, 0]}
            >
              {data.map((entry, index) => (
                <cell key={`cell-${index}`} fill={entry.isPositive ? '#10b981' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex justify-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-emerald-500 rounded"></span>
          <span>Increases Price</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-red-500 rounded"></span>
          <span>Decreases Price</span>
        </div>
      </div>
    </div>
  );
};

export default SHAPSummaryChart;
