import React from 'react';

const ErrorState = ({ error, onRetry }) => {
  return (
    <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-300 rounded-xl p-6 mb-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="text-4xl animate-bounce">⚠️</div>
        <div className="flex-1">
          <p className="text-red-900 font-bold text-lg mb-1">Unable to Load Services</p>
          <p className="text-red-700 text-sm mb-4 font-medium">{error}</p>
          <div className="flex gap-3 flex-wrap">
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition active:scale-95"
              >
                🔄 Retry Now
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-semibold transition active:scale-95"
            >
              ↻ Refresh Page
            </button>
          </div>
        </div>
      </div>

      {/* Helpful tips */}
      <div className="mt-6 pt-6 border-t border-red-200">
        <p className="text-xs font-semibold text-red-800 mb-2">💡 Troubleshooting Tips:</p>
        <ul className="text-xs text-red-700 space-y-1">
          <li>• Check if the backend server is running</li>
          <li>• Verify MongoDB is connected and running</li>
          <li>• Check your internet connection</li>
          <li>• Try refreshing the page</li>
        </ul>
      </div>
    </div>
  );
};

export default ErrorState;
