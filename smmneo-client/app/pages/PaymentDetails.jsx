import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useParams, useNavigate, useLocation } from 'react-router';
import '../styles/payment.css';
import { submitAddFundRequest } from '../services/paymentAPI';
import { useAuth } from '../components/AuthContext.jsx';
import { getApiUrl } from '../config/api.js';
import bkashLogo from '../assets/bkash.png';
import nagadLogo from '../assets/nagad.png';
import rocketLogo from '../assets/rocket.png';


const logoMap = {
  bkash: bkashLogo,
  nagad: nagadLogo,
  rocket: rocketLogo,
};

export default function PaymentDetails(){
  const { user } = useAuth();
  const { methodKey } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [method, setMethod] = useState(null);
  const [amount, setAmount] = useState(location.state?.amount || '127');
  const [senderNumber, setSenderNumber] = useState('');
  const [txn, setTxn] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(()=>{
    // prefer method passed via navigation state (so custom logo from frontend/backend is preserved)
    if (location.state && location.state.method) {
      const m = location.state.method;
      setMethod({
        ...m,
        logo: m.logo || logoMap[(m.key || m._id || m.id || '').toString().toLowerCase()] || bkashLogo,
      });
      return;
    }

    (async ()=>{
      try{
        const resp = await fetch(getApiUrl('/api/payments/numbers'));
        const json = await resp.json().catch(()=>null);
        if (json && json.success && Array.isArray(json.data)){
          const found = json.data.find(d => (d.key||d._id||d.id) === methodKey || d.key === methodKey);
          if (found) return setMethod({
            ...found,
            logo: found.logo || logoMap[(found.key||found._id||found.id||'').toString().toLowerCase()] || bkashLogo,
            number: found.number || found.value || found.meta?.number || found.number,
          });
        }
      }catch(err){/* ignore */}
      setMethod({ key: methodKey, label: methodKey, number: '—', logo: logoMap[methodKey] || bkashLogo });
    })();
  },[methodKey]);

  function toBase64(file){
    return new Promise((res, rej)=>{
      const reader = new FileReader();
      reader.onload = ()=> res(reader.result.split(',')[1]);
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });
  }

  async function handlePay(e){
    e.preventDefault();
    setLoading(true); setMessage(null);
    try{
      const trimmedTxn = String(txn || '').trim();
      if (!trimmedTxn) {
        setMessage({ type: 'error', text: 'Transaction ID is required.' });
        setLoading(false);
        return;
      }
      const rawUsername = user?.username || (user?.displayName && !user.displayName.includes('@') ? user.displayName : null) || user?.email;
      const normalizedUsername = rawUsername
        ? rawUsername.toString().trim().replace(/\s+/g, '_').replace(/@.*$/, '').toLowerCase()
        : null;
      const payload = {
        paymentMethod: methodKey,
        amount: Number(amount),
        paymentNumber: method.number || '',
        clientNumber: senderNumber,
        transactionId: trimmedTxn,
        userId: user?.uid || null,
        username: normalizedUsername || null,
      };
      if (screenshot) payload.screenshotBase64 = await toBase64(screenshot);
      const resp = await submitAddFundRequest(payload);
      if (resp && resp.success){
        toast.success('Payment request submitted — pending verification.');
        setMessage({type:'success', text:'Payment request submitted — pending verification.'});
        setTimeout(()=>navigate('/dashboard'),1500);
      } else {
        toast.error(resp.error || 'Failed to submit payment request');
        setMessage({type:'error', text:resp.error || 'Failed'});
      }
    }catch(err){ setMessage({type:'error', text:err.message||'Failed'}); }
    finally{ setLoading(false); }
  }

  if (!method) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="bg-slate-50 min-h-screen flex items-center justify-center p-0 sm:p-6 font-sans">
      <div className="bg-white w-full sm:max-w-md md:max-w-lg rounded-none sm:rounded-2xl shadow-none sm:shadow-lg border-0 sm:border border-gray-100 flex flex-col min-h-screen sm:min-h-auto">

        <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <button className="text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-gray-50" onClick={() => navigate(-1)}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button className="text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-gray-50" onClick={() => navigate('/dashboard')}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 sm:p-5 flex-1 overflow-y-auto">

          <div className="flex justify-center mb-5">
            {method.logo ? (
              <img src={method.logo} alt={method.label || method.key} className="h-12 object-contain" />
            ) : (
              <span className="text-pink-600 font-black text-2xl italic tracking-tight flex items-center gap-1">
                {method.label || method.key} <span className="text-xs not-italic bg-pink-600 text-white px-1 rounded font-normal">Manual</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <div className="border border-gray-100 rounded-xl p-3 flex items-center gap-3 bg-slate-50/50">
              <div className="w-10 h-10 rounded-full border border-blue-200 flex items-center justify-center bg-white shrink-0 p-1">
                {method.logo ? (
                  <img src={method.logo} alt={method.label || method.key} className="w-full h-full object-contain rounded-full" />
                ) : (
                  <span className="text-[10px] font-bold uppercase text-blue-600">Pay</span>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Merchant</p>
                <h4 className="text-sm font-bold text-slate-700">{method.label || method.key}</h4>
              </div>
            </div>

            <div className="border border-gray-100 rounded-xl p-3 flex flex-col justify-center items-start sm:items-end bg-slate-50/50">
              <p className="text-xs text-gray-400 font-medium">Amount</p>
              <h3 className="text-lg font-black text-slate-700">{amount} BDT</h3>
            </div>
          </div>

          <div className="border border-gray-100 rounded-2xl p-4 bg-white shadow-sm mb-5 text-xs sm:text-sm text-slate-700 space-y-3.5">

            <div className="flex items-start gap-2.5">
              <span className="text-blue-600 font-bold mt-0.5">•</span>
              <p>আপনার <strong className="text-pink-600 font-bold">{method.label}</strong> মোবাইল অ্যাপে যান।</p>
            </div>

            <hr className="border-gray-100" />

            <div className="flex items-start gap-2.5">
              <span className="text-blue-600 font-bold mt-0.5">•</span>
              <p><strong className="font-bold">Send Money</strong> -এ ক্লিক করুন।</p>
            </div>

            <hr className="border-gray-100" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <span className="text-blue-600 font-bold mt-0.5">•</span>
                <p>প্রাপক নম্বর হিসেবে এই নম্বরটি লিখুন: <strong className="font-bold font-mono tracking-wide text-slate-800 selection:bg-blue-100">{method.number || method.meta?.number || '01889458590'}</strong></p>
              </div>
              <button type="button" onClick={()=>{navigator.clipboard?.writeText(method.number || method.meta?.number || '')}} className="self-end sm:self-auto flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition active:scale-95 shadow-sm">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
                কপি করুন
              </button>
            </div>

            <hr className="border-gray-100" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <span className="text-blue-600 font-bold mt-0.5">•</span>
                <p>টাকার পরিমাণ: <strong className="font-bold">{amount} BDT</strong></p>
              </div>
              <button type="button" onClick={()=>{navigator.clipboard?.writeText(String(amount))}} className="self-end sm:self-auto flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition active:scale-95 shadow-sm">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
                কপি করুন
              </button>
            </div>

            <hr className="border-gray-100" />

            <div className="flex items-start gap-2.5">
              <span className="text-blue-600 font-bold mt-0.5">•</span>
              <p>নিশ্চিত করতে এখন আপনার <strong className="text-pink-600 font-bold">{method.label}</strong> পিন লিখুন।</p>
            </div>

            <hr className="border-gray-100" />

            <div className="flex items-start gap-2.5">
              <span className="text-blue-600 font-bold mt-0.5">•</span>
              <p>এখন নিচের বক্সে আপনার <strong className="font-bold">Sender Number</strong> ও <strong className="font-bold">Transaction ID</strong> দিন এবং নিচের <strong className="font-bold text-blue-600">Verify</strong> বাটনে ক্লিক করুন।</p>
            </div>
          </div>

          <div className="space-y-4 mb-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-700">Sender Number</label>
              <input 
                type="tel" 
                value={senderNumber}
                onChange={(e)=>setSenderNumber(e.target.value)}
                placeholder="যে নম্বর থেকে টাকা পাঠিয়েছেন লিখুন" 
                className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition bg-slate-50/50"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-700">Transaction ID</label>
              <input 
                type="text" 
                value={txn}
                onChange={(e)=>setTxn(e.target.value)}
                placeholder="ট্রানজেকশন আইডি লিখুন" 
                className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition bg-slate-50/50"
              />
            </div>
          </div>

        </div>

        <div className="p-4 bg-white border-t border-gray-100 sticky bottom-0 sm:static sm:rounded-b-2xl">
          <form onSubmit={handlePay}>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-3 font-bold text-lg shadow-sm">
              {loading ? 'Submitting...' : 'Verify'}
            </button>
            {message && <div className={`mt-3 text-sm ${message.type==='success' ? 'text-green-600' : 'text-red-600'}`}>{message.text}</div>}
          </form>
        </div>

      </div>
    </div>
  );
}
