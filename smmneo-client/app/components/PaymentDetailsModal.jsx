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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose}></div>
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md z-10 p-6">
        <div className="flex items-center gap-4">
          <img src={method.logo} alt={method.name} className="w-16 h-10 object-contain" />
          <div>
            <div className="font-bold">{method.name}</div>
            <div className="text-sm text-gray-500">{method.accountType}</div>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-700">
          <div><strong>Amount:</strong> {amount} BDT</div>
          <div><strong>Payment Number:</strong> {method.number}</div>
          <div className="mt-2 p-3 bg-gray-50 rounded text-sm">{method.instruction}</div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Client Number</label>
            <input value={clientNumber} onChange={(e)=>setClientNumber(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" placeholder="01XXXXXXXXX" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
            <input value={transactionId} onChange={(e)=>setTransactionId(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" placeholder="TXN123456" />
          </div>
          <div className="flex items-center gap-2">
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded">{loading ? 'Submitting...' : 'Submit Payment'}</button>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded border">Cancel</button>
          </div>
          {message && <div className={`p-2 rounded ${message.type==='success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{message.text}</div>}
        </form>
      </div>
    </div>
  );
}
