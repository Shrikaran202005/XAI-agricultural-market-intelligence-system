import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  ScatterChart,
  Scatter,
  ComposedChart,
  Line
} from 'recharts';

const SHAPVisualization = ({ shapData, featureImportance, explanation }) => {
  const [activeTab, setActiveTab] = useState('waterfall');
  const [hoveredFeature, setHoveredFeature] = useState(null);

  // Colors for positive and negative impacts
  const positiveColor = '#10b981';
  const negativeColor = '#ef4444';
  const neutralColor = '#6b7280';

  // Format feature names for display
  const formatFeatureName = (featureName) => {
    const nameMap = {
      'demand': 'Market Demand',
      'supply': 'Crop Supply',
      'weather': 'Weather Conditions',
      'season': 'Seasonal Factors',
      'market_trend': 'Market Trends',
      'historical_price': 'Historical Prices',
      'transport_cost': 'Transportation Costs',
      'storage_cost': 'Storage Costs'
    };
    return nameMap[featureName] || featureName;
  };

  // Process SHAP data for waterfall chart
  const waterfallData = useMemo(() => {
    if (!shapData || !shapData.shap_values || !shapData.feature_names) return [];
    
    return shapData.shap_values.map((value, index) => ({
      feature: formatFeatureName(shapData.feature_names[index]),
      contribution: value,
      fill: value >= 0 ? positiveColor : negativeColor
    }));
  }, [shapData]);

  // Process feature importance for bar chart
  const importanceData = useMemo(() => {
    if (!featureImportance || !Array.isArray(featureImportance)) return [];
    
    return featureImportance
      .map((item) => ({
        feature: formatFeatureName(item.feature),
        importance: Math.abs(item.importance),
        fill: item.importance >= 0 ? positiveColor : negativeColor
      }))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 8); // Top 8 features
  }, [featureImportance]);

  // Waterfall chart custom shape
  const WaterfallBar = (props) => {
    const { x, y, width, fill } = props;
    
    return (
      <g>
        <rect x={x} y={y} width={width} height={20} fill={fill} />
        <line
          x1={x}
          y1={y + 10}
          x2={x + width}
          y2={y + 10}
          stroke="#666"
          strokeWidth={1}
        />
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const contribution = data.contribution !== undefined ? data.contribution : data.importance;
      if (contribution === undefined) return null;
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.feature}</p>
          <p className={`text-sm font-medium ${contribution >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {contribution >= 0 ? '+' : ''}{contribution.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">SHAP Analysis</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('waterfall')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              activeTab === 'waterfall' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Waterfall
          </button>
          <button
            onClick={() => setActiveTab('importance')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              activeTab === 'importance' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Feature Importance
          </button>
        </div>
      </div>

      {activeTab === 'waterfall' && (
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-800 mb-4">Feature Contributions</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={waterfallData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="feature" 
                angle={-45}
                textAnchor="end"
                height={80}
                width={100}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="contribution" shape={<WaterfallBar />} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeTab === 'importance' && (
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-800 mb-4">Feature Importance</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={importanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="feature" 
                angle={-45}
                textAnchor="end"
                height={80}
                width={100}
              />
              <YAxis />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0];
                    return (
                      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                        <p className="font-semibold text-gray-900">{data.feature}</p>
                        <p className="text-sm font-medium text-gray-600">
                          Importance: {data.importance.toFixed(2)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="importance" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {explanation && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-md font-medium text-blue-900 mb-2">AI Explanation</h4>
          {typeof explanation === 'string' ? (
            <p className="text-gray-700">{explanation}</p>
          ) : explanation.top_features ? (
            <div className="space-y-2">
              {explanation.top_features.slice(0, 5).map((feature, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-700">{feature.feature}</span>
                  <span className={`font-medium ${feature.importance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {feature.importance.toFixed(4)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-700">No explanation available</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SHAPVisualization;
