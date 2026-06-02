import React from 'react';

const MiddlemanResultCard = ({ results }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getDecisionColor = (decision) => {
    switch (decision.toLowerCase()) {
      case 'buy now':
        return 'green';
      case 'wait':
        return 'yellow';
      case 'avoid':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getDecisionIcon = (decision) => {
    switch (decision.toLowerCase()) {
      case 'buy now':
        return (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'wait':
        return (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'avoid':
        return (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">
        Demand Analysis Results
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`${getDecisionColor(results.recommendation)}-50 rounded-lg p-4 border ${getDecisionColor(results.recommendation)}-200`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Recommendation</p>
              <p className={`text-2xl font-bold text-${getDecisionColor(results.recommendation)}-700 capitalize`}>
                {results.recommendation}
              </p>
            </div>
            <div className={`text-${getDecisionColor(results.recommendation)}-500`}>
              {getDecisionIcon(results.recommendation)}
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Market Price</p>
              <p className="text-2xl font-bold text-blue-700">
                {formatCurrency(results.current_price)}/quintal
              </p>
            </div>
            <div className="text-blue-500">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Available Supply</p>
              <p className="text-2xl font-bold text-green-700">
                {results.available_supply} quintals
              </p>
            </div>
            <div className="text-green-500">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Demand Level</p>
              <p className="text-2xl font-bold text-purple-700 capitalize">
                {results.demand_level}
              </p>
            </div>
            <div className="text-purple-500">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {results.reasoning && (
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Analysis Reasoning</h4>
          <p className="text-sm text-gray-600">{results.reasoning}</p>
        </div>
      )}

      {results.suppliers && results.suppliers.length > 0 && (
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Recommended Suppliers</h4>
          <div className="space-y-2">
            {results.suppliers.map((supplier, index) => (
              <div key={index} className="flex justify-between items-center bg-white rounded p-2">
                <span className="text-sm text-gray-700">{supplier.name}</span>
                <span className="text-sm text-gray-500">{supplier.location}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MiddlemanResultCard;
