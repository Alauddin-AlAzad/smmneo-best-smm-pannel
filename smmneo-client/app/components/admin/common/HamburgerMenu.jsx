import React from 'react';

const HamburgerMenu = ({ isOpen, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="lg:hidden flex flex-col items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-100 transition"
      aria-label="Toggle menu"
    >
      <div className="w-6 h-5 flex flex-col justify-between">
        <span
          className={`h-0.5 w-full bg-slate-900 transition-all duration-300 ${
            isOpen ? 'rotate-45 translate-y-2' : ''
          }`}
        />
        <span
          className={`h-0.5 w-full bg-slate-900 transition-all duration-300 ${
            isOpen ? 'opacity-0' : ''
          }`}
        />
        <span
          className={`h-0.5 w-full bg-slate-900 transition-all duration-300 ${
            isOpen ? '-rotate-45 -translate-y-2' : ''
          }`}
        />
      </div>
    </button>
  );
};

export default HamburgerMenu;
