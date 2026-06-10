import React, { useState } from 'react';
import { useNavigate } from 'react-router';

export default function AddFund() {
  const [usd, setUsd] = useState('');
  const [bdt, setBdt] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const conversionRate = 130; // 1 USD = 130 BDT
  const minDepositBdt = 20;

  function toNumber(v){
    const n = Number(String(v).replace(/[^0-9.-]+/g, ''));
    return Number.isFinite(n) ? n : 0;
  }

  function handleUsdChange(v){
    setUsd(v);
    if (v === '' || v === null) {
      setBdt('');
      return;
    }
    const n = toNumber(v);
    if (n > 0) {
      setBdt(String((n * conversionRate).toFixed(2)));
    }
  }

  function handleBdtChange(v){
    setBdt(v);
    if (v === '' || v === null) {
      setUsd('');
      return;
    }
    const n = toNumber(v);
    if (n > 0) {
      setUsd(String((n / conversionRate).toFixed(2)));
    }
  }

  function handlePayNow(){
    const amountBdt = toNumber(bdt || 0);
    if (amountBdt < minDepositBdt){
      setError(`Minimum deposit is ${minDepositBdt} BDT`);
      return;
    }
    setError('');
    navigate('/dashboard/add-fund/gateways', { state: { amount: amountBdt, bdt: amountBdt, usd: Number(usd) } });
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="mb-6 text-2xl font-semibold text-center text-slate-700">Add Funds</h2>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
        <div className="mb-4 text-sm font-semibold text-gray-700">Enter Amount</div>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs text-gray-500">Amount (BDT)</label>
                <input type="number" step="0.01" min="0" placeholder="Enter amount" value={bdt} onChange={(e)=>handleBdtChange(e.target.value)} className="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&]:-moz-appearance-textfield" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Amount (USD)</label>
                <input type="number" step="0.01" min="0" placeholder="Enter amount" value={usd} onChange={(e)=>handleUsdChange(e.target.value)} className="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&]:-moz-appearance-textfield" />
              </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 items-center mb-4">
          <div>
            <div className="text-xs text-gray-500">Conversion Rate</div>
            <div className="text-sm font-semibold">1 USD = {conversionRate} BDT</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Minimum deposit</div>
            <div className="text-sm font-semibold">{minDepositBdt} BDT</div>
          </div>
        </div>

        {error && <div className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="mt-5">
          <button onClick={handlePayNow} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">Proceed to Pay</button>
        </div>
      </div>
    </div>
  );
}
