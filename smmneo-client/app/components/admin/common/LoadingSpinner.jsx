import React from 'react';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 p-16 text-center shadow-sm">
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="inline-block animate-spin text-6xl">⏳</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
      <p className="text-xl font-bold text-slate-900 mb-3">{message}</p>
      <p className="text-slate-500 text-sm">This won't take long...</p>

      {/* Animated dots */}
      <div className="flex justify-center gap-1.5 mt-6">
        <div className="w-2 h-2 bg-violet-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
        <div className="w-2 h-2 bg-violet-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-2 h-2 bg-violet-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
