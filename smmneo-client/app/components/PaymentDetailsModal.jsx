import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { submitAddFundRequest } from '../services/paymentAPI';

export default function PaymentDetailsModal({ open, onClose, method, amount = 127, onSuccess }) {
  const [clientNumber, setClientNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  if (!open || !method) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    if (!clientNumber) return setMessage({ type: 'error', text: 'Client Number required' });
    if (!transactionId) return setMessage({ type: 'error', text: 'Transaction ID required' });
    try {
      setLoading(true);
      const payload = {
        paymentMethod: method.key,
        amount,
        paymentNumber: method.number,
        clientNumber,
        transactionId,
      };
      const resp = await submitAddFundRequest(payload);
      if (resp && resp.success) {
        toast.success('Payment submitted — pending verification');
        setMessage({ type: 'success', text: 'Payment submitted — pending verification' });
        setClientNumber(''); setTransactionId('');
        onSuccess && onSuccess(resp.data);
      } else {
        toast.error(resp.error || 'Failed to submit payment');
        setMessage({ type: 'error', text: resp.error || 'Failed' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop Backdrop overlay */}
      <div className="fixed inset-0 bg-black/40" onClick={onClose}></div>
      
      {/* Modal Content Box */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg z-10 p-5">
        
        {/* Title */}
        <h3 className="text-base font-bold text-gray-800 mb-4">Complete Your Payment</h3>

        {/* Half-Width Side-by-Side Cards */}
        <div className="grid grid-cols-2 gap-3 w-full">
          
          {/* Left Card: Merchant Details */}
          <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl shadow-sm min-w-0">
            <div className="w-10 h-10 rounded-full border border-blue-50 flex items-center justify-center shrink-0 bg-white">
              <img src={method.logo} alt={method.name} className="w-7 h-auto object-contain" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-gray-400 font-medium tracking-wide uppercase">Merchant</div>
              <div className="font-bold text-gray-800 text-base truncate leading-tight">{method.name}</div>
              <div className="text-[11px] text-gray-400 truncate mt-0.5">{method.accountType}</div>
            </div>
          </div>

          {/* Right Card: Amount Details */}
          <div className="flex flex-col justify-center items-end p-3 bg-white border border-gray-100 rounded-2xl shadow-sm text-right">
            <div className="text-[11px] text-gray-400 font-medium tracking-wide uppercase mb-0.5">Amount</div>
            <div className="font-extrabold text-gray-900 text-lg sm:text-xl tracking-tight">
              {amount} <span className="text-sm font-bold text-gray-600">BDT</span>
            </div>
          </div>

        </div>

        {/* Payment Number and Instructions */}
        <div className="mt-3 space-y-2">
          <div className="p-3 bg-blue-50/60 border border-blue-100/70 rounded-xl text-xs text-blue-900">
            <strong>Payment Number:</strong> <span className="font-mono tracking-wider">{method.number}</span>
          </div>
          {method.instruction && (
            <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-600 leading-relaxed">
              {method.instruction}
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Client Number</label>
            <input 
              value={clientNumber} 
              onChange={(e) => setClientNumber(e.target.value)} 
              className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" 
              placeholder="01XXXXXXXXX" 
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Transaction ID</label>
            <input 
              value={transactionId} 
              onChange={(e) => setTransactionId(e.target.value)} 
              className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" 
              placeholder="TXN123456" 
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button 
              type="submit" 
              disabled={loading} 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Payment'}
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>

          {/* Alert Message */}
          {message && (
            <div className={`p-2.5 rounded-xl text-xs font-medium text-center ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message.text}
            </div>
          )}
        </form>

      </div>
    </div>
  );
}