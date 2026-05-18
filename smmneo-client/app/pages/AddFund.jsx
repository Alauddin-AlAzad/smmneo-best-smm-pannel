import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../components/AuthContext.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';
import toast from 'react-hot-toast';

export default function AddFund() {
  const { addFunds } = useAuth();
  const { BDT_PER_USD } = useCurrency();
  const [usdAmount, setUsdAmount] = useState('');
  const [bdtAmount, setBdtAmount] = useState('');
  const [activeCurrency, setActiveCurrency] = useState('USD');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const syncFromUsd = (value) => {
    setUsdAmount(value);
    setActiveCurrency('USD');

    if (value === '') {
      setBdtAmount('');
      return;
    }

    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) {
      setBdtAmount('');
      return;
    }

    setBdtAmount((numericValue * BDT_PER_USD).toFixed(2));
  };

  const syncFromBdt = (value) => {
    setBdtAmount(value);
    setActiveCurrency('BDT');

    if (value === '') {
      setUsdAmount('');
      return;
    }

    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) {
      setUsdAmount('');
      return;
    }

    setUsdAmount((numericValue / BDT_PER_USD).toFixed(4));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const rawAmount = activeCurrency === 'BDT' ? bdtAmount : usdAmount;
    const val = Number(rawAmount);
    if (!val || val <= 0) return toast.error('Enter a valid amount');
    try {
      setSubmitting(true);
      await addFunds(val, activeCurrency);
      toast.success('Funds added');
      navigate('/dashboard');
    } catch (err) {
      // handled in addFunds
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="mb-3 text-lg font-bold">Add Funds</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">USD</label>
            <input
              type="number"
              step="any"
              value={usdAmount}
              onChange={(e) => syncFromUsd(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-md border border-slate-200 px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">BDT</label>
            <input
              type="number"
              step="any"
              value={bdtAmount}
              onChange={(e) => syncFromBdt(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-md border border-slate-200 px-3 py-2"
            />
          </div>
        </div>

        <p className="text-xs text-slate-500">
          1 USD = {BDT_PER_USD} BDT
        </p>

        <div>
          <button disabled={submitting} className="w-full rounded-md bg-violet-600 px-4 py-2 text-white">
            {submitting ? 'Processing...' : 'Add Funds'}
          </button>
        </div>
      </form>
    </div>
  );
}
