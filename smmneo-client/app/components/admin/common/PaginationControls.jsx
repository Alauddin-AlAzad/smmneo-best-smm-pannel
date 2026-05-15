import React from 'react';

const PaginationControls = ({ pagination, loading, onPageChange, onNextPage, onPreviousPage }) => {
  const { currentPage, totalPages, totalItems, itemsPerPage } = pagination;

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    const halfVisible = Math.floor(maxVisible / 2);

    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);

    if (endPage - startPage < maxVisible - 1) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + maxVisible - 1);
      } else {
        startPage = Math.max(1, endPage - maxVisible + 1);
      }
    }

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('...');
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-200 p-6 shadow-sm">
      {/* Info Section */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200">
        <div className="text-sm text-slate-700">
          <p className="font-semibold text-slate-900">
            📊 Showing{' '}
            <span className="font-bold text-violet-600">
              {(currentPage - 1) * itemsPerPage + 1}
            </span>{' '}
            to{' '}
            <span className="font-bold text-violet-600">
              {Math.min(currentPage * itemsPerPage, totalItems)}
            </span>{' '}
            of{' '}
            <span className="font-bold text-violet-600">
              {totalItems.toLocaleString()}
            </span>{' '}
            services
          </p>
          <p className="text-xs text-slate-500 mt-1">Page {currentPage} of {totalPages}</p>
        </div>

        {/* Quick Jump */}
        <div className="flex items-center gap-3 bg-white rounded-lg border border-slate-200 p-2">
          <label className="text-xs font-semibold text-slate-600 whitespace-nowrap pl-2">Go to:</label>
          <select
            value={currentPage}
            onChange={(e) => onPageChange(parseInt(e.target.value))}
            disabled={loading}
            className="px-3 py-1.5 border-0 text-sm bg-slate-100 hover:bg-slate-200 rounded focus:ring-2 focus:ring-violet-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-slate-900"
          >
            {Array.from({ length: Math.min(totalPages, 100) }, (_, i) => i + 1).map((page) => (
              <option key={page} value={page}>
                {page}
              </option>
            ))}
            {totalPages > 100 && (
              <option disabled>... (100+)</option>
            )}
          </select>
        </div>
      </div>

      {/* Button Controls */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {/* Previous Button */}
        <button
          onClick={onPreviousPage}
          disabled={!pagination.hasPreviousPage || loading}
          className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <span>←</span> Previous
        </button>

        {/* Page Numbers */}
        <div className="flex gap-2 items-center">
          {generatePageNumbers().map((page, idx) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="px-2 py-2 text-slate-400 font-bold">
                  …
                </span>
              );
            }

            const isActive = page === currentPage;

            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                disabled={loading}
                className={`px-3 py-2.5 rounded-lg font-semibold transition min-w-[40px] ${
                  isActive
                    ? 'bg-gradient-to-br from-violet-600 to-violet-700 text-white shadow-lg shadow-violet-200'
                    : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          onClick={onNextPage}
          disabled={!pagination.hasNextPage || loading}
          className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          Next <span>→</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mt-6 pt-6 border-t border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-slate-600">Progress</p>
          <p className="text-xs font-bold text-violet-600">{Math.round((currentPage / totalPages) * 100)}%</p>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-violet-600 transition-all duration-300"
            style={{ width: `${(currentPage / totalPages) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default PaginationControls;

