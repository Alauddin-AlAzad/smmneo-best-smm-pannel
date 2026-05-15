import React, { useState, useEffect, useRef } from 'react';

const SearchBar = ({ onSearch, loading, placeholder = 'Search services...' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const debounceTimer = useRef(null);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      onSearch(searchTerm);
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchTerm, onSearch]);

  return (
    <div className="relative group">
      <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-all ${isFocused ? 'text-violet-600' : 'text-slate-400'}`}>
        🔍
      </div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        disabled={loading}
        className={`w-full pl-12 pr-12 py-3 border-2 transition-all rounded-lg text-sm font-medium focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
          isFocused
            ? 'border-violet-500 bg-white shadow-lg shadow-violet-200'
            : 'border-slate-200 bg-white hover:border-slate-300'
        }`}
      />
      {searchTerm && (
        <button
          onClick={() => setSearchTerm('')}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-700 transition font-bold text-lg"
        >
          ✕
        </button>
      )}

      {/* Search indicator */}
      {searchTerm && (
        <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
          <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded">
            {loading ? '🔄 searching...' : '✓ done'}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;

