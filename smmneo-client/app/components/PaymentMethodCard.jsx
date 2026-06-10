import React from 'react';

export default function PaymentMethodCard({ id, name, logo, accountType, number, active, onClick }) {
  return (
    <button
      type="button"
      className={`p-method-card ${active ? 'active' : ''}`}
      onClick={() => onClick && onClick(id)}
      aria-pressed={active}
    >
      <div className="p-method-top">
        <img src={logo} alt={`${name} logo`} className="p-method-logo" />
        <div>
          <div className="p-method-label">{name}</div>
          {number && <div className="p-method-number">{number}</div>}
        </div>
      </div>
      <div className="p-method-meta">{accountType || ''}</div>
    </button>
  );
}
