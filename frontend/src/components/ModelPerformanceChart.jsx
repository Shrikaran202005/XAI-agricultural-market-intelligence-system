import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

const ModelPerformanceChart = ({ performanceData, title = "Model Performance Metrics" }) => {
  if (!performanceData || !Array.isArray(performanceData) || performanceData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <p className="text-gray-500 text-center py-8">No performance data available</p>
      </div>
    );
  }

  // Prepare data for visualization
  const chartData = performanceData.map((data, index) => ({
    iteration: index + 1,
    actual_price: data.actual_price,
    predicted_price: data.predicted_price,
    error: data.actual_price - data.predicted_price,
    absolute_error: Math.abs(data.actual_price - data.predicted_price),
    confidence: data.confidence || 85
  }));

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-2">Prediction #{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              Error: {formatCurrency(payload[0].payload.error)}
            </p>
            <p className="text-xs text-gray-600">
              Confidence: {payload[0].payload.confidence}%
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate overall metrics
  const totalPredictions = chartData.length;
  const avgError = chartData.reduce((sum, d) => sum + d.absolute_error, 0) / totalPredictions;
  const avgConfidence = chartData.reduce((sum, d) => sum + d.confidence, 0) / totalPredictions;
  const maxError = Math.max(...chartData.map(d => d.absolute_error));
  const minError = Math.min(...chartData.map(d => d.absolute_error));

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      
      {/* Performance Metrics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-sm text-blue-600 font-medium">Total Predictions</p>
          <p className="text-lg font-semibold text-blue-700">{totalPredictions}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-sm text-green-600 font-medium">Avg Error</p>
          <p className="text-lg font-semibold text-green-700">{formatCurrency(avgError)}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <p className="text-sm text-purple-600 font-medium">Avg Confidence</p>
          <p className="text-lg font-semibold text-purple-700">{avgConfidence.toFixed(1)}%</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-3 text-center">
          <p className="text-sm text-orange-600 font-medium">Max Error</p>
          <p className="text-lg font-semibold text-orange-700">{formatCurrency(maxError)}</p>
        </div>
      </div>

      {/* Actual vs Predicted Chart */}
      <div className="mb-8">
        <h4 className="text-md font-semibold text-gray-700 mb-3">Actual vs Predicted Prices</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="iteration" 
                stroke="#666"
                fontSize={12}
                label={{ value: 'Prediction Number', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                tickFormatter={(value) => `Rs ${value}`}
                stroke="#666"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="actual_price" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                name="Actual Price"
              />
              <Line 
                type="monotone" 
                dataKey="predicted_price" 
                stroke="#22c55e" 
                strokeWidth={2}
                dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                name="Predicted Price"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Error Analysis Chart */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-gray-700 mb-3">Prediction Error Analysis</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="iteration" 
                stroke="#666"
                fontSize={12}
                label={{ value: 'Prediction Number', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                tickFormatter={(value) => `Rs ${value}`}
                stroke="#666"
                fontSize={12}
              />
              <Tooltip 
                formatter={(value) => [formatCurrency(value), 'Absolute Error']}
              />
              <Area 
                type="monotone" 
                dataKey="absolute_error" 
                stroke="#ef4444" 
                fill="#ef4444"
                fillOpacity={0.3}
                strokeWidth={2}
                name="Absolute Error"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Confidence Score Chart */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-gray-700 mb-3">Model Confidence Scores</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="iteration" 
                stroke="#666"
                fontSize={12}
                label={{ value: 'Prediction Number', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                domain={[0, 100]}
                stroke="#666"
                fontSize={12}
                label={{ value: 'Confidence (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value) => [`${value}%`, 'Confidence']}
              />
              <Area 
                type="monotone" 
                dataKey="confidence" 
                stroke="#8b5cf6" 
                fill="#8b5cf6"
                fillOpacity={0.3}
                strokeWidth={2}
                name="Confidence"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Performance Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">
              <span className="font-medium">Accuracy Range:</span> {formatCurrency(minError)} - {formatCurrency(maxError)}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Average Accuracy:</span> {((1 - avgError / 2000) * 100).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-gray-600">
              <span className="font-medium">High Confidence Predictions:</span> {chartData.filter(d => d.confidence >= 80).length}/{totalPredictions}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Low Error Predictions:</span> {chartData.filter(d => d.absolute_error <= 200).length}/{totalPredictions}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelPerformanceChart;
