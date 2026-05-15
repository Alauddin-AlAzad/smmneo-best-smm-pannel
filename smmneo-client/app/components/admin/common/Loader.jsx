import React from 'react';

const Loader = ({ size = 'md', fullPage = false }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const loaderContent = (
    <div className={`${sizes[size]} animate-spin rounded-full border-4 border-slate-200 border-t-violet-600`} />
  );

  if (fullPage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {loaderContent}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-8">
      {loaderContent}
    </div>
  );
};

export default Loader;
