import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import PaymentMethodCard from '../components/PaymentMethodCard';
import '../styles/payment.css';
import bkashLogo from '../assets/bkash.png';
import nagadLogo from '../assets/nagad.png';
import rocketLogo from '../assets/rocket.png';

const API_BASE_URL = (import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000').replace(/\/\/$/, '');

const logoMap = {
  bkash: bkashLogo,
  nagad: nagadLogo,
  rocket: rocketLogo,
};
const FALLBACK_METHODS = [
  { key: 'bkash', label: 'bKash', short: 'Mobile wallet', logo: bkashLogo, color: '#e60000' },
  { key: 'nagad', label: 'Nagad', short: 'Mobile wallet', logo: nagadLogo, color: '#ff6a00' },
  { key: 'rocket', label: 'Rocket', short: 'Mobile wallet', logo: rocketLogo, color: '#0066ff' },
];

export default function Payment() {
  const location = useLocation();
  const [methods, setMethods] = useState(FALLBACK_METHODS);
  const [method, setMethod] = useState(FALLBACK_METHODS[0].key);
  const [amount, setAmount] = useState(location.state?.amount || '');
  const [message, setMessage] = useState(null);

  const navigate = useNavigate();

  useEffect(()=>{
    let mounted = true;
    (async ()=>{
      try{
        const resp = await fetch(`${API_BASE_URL}/api/payments/numbers`);
        const json = await resp.json().catch(()=>null);
        if (!mounted) return;
        if (json && json.success && Array.isArray(json.data) && json.data.length>0) {
          // normalize
          const list = json.data.map((d)=>({
            key: (d.key || d._id || d.id || '').toString().toLowerCase(),
            label: d.label || d.key,
            number: d.number || d.value || d.meta?.number,
            logo: d.logo || d.logoPath || d.logoUrl || logoMap[(d.key || d._id || d.id || '').toString().toLowerCase()],
            short: d.meta?.description || '',
            raw: d,
          }));
          setMethods(list);
          setMethod((m)=>{
            // keep current if exists, else set first
            if (list.find(x=>x.key===m)) return m;
            return list[0].key;
          });
        }
      }catch(err){
        // ignore - keep fallback      }
    })();
    return ()=>{ mounted=false };
  },[]);

  function handleOpenDetails(key, m) {
    // navigate immediately to details for the clicked gateway
    // pass the full method object in state so details page can use custom/logo provided by backend or client
    navigate(`/dashboard/add-fund/pay/${key}`, { state: { amount, method: m } });
  }

  function handlePayButton() {
    const sel = method || (methods && methods[0] && methods[0].key);
    if (!sel) {
      setMessage({ type: 'error', text: 'Please select a payment method' });
      return;
    }
    setMessage(null);
    navigate(`/dashboard/add-fund/pay/${sel}`, { state: { amount } });
  }

  return (
    <div className="bg-slate-50 min-h-screen flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 w-full max-w-2xl">

        <div className="border border-gray-200 rounded-xl p-3 flex justify-end items-center mb-6 h-12">
          <button className="text-gray-400 hover:text-gray-600 transition" onClick={() => window.history.back()}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full border border-blue-200 flex flex-col items-center justify-center bg-blue-50 text-blue-600 shrink-0 shadow-sm">
            <span className="text-[10px] font-bold tracking-wider leading-none">payment</span>
            <span className="text-[8px] uppercase tracking-widest text-blue-400 font-semibold mt-0.5">gateway</span>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-700 mb-1.5">Payment Gateway</h2>
            <div className="flex flex-wrap gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1 text-sm border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-50 transition"> 
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                সহায়তা
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1 text-sm border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-50 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                প্রশ্নাবলী
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1 text-sm border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-50 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                বিস্তারিত
              </button>
            </div>
          </div>
        </div>

        <div className="flex bg-blue-600 rounded-lg overflow-hidden text-white font-medium mb-6 shadow-sm text-sm sm:text-base">
          <button className="flex-1 py-3 text-center bg-blue-800 font-semibold transition">মোবাইল ব্যাংকিং</button>
          <button className="flex-1 py-3 text-center hover:bg-blue-700 transition border-x border-blue-500/30">ইন্টারন্যাশনাল</button>
          <button className="flex-1 py-3 text-center hover:bg-blue-700 transition">নেট ব্যাংকিং</button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {methods.map((m) => (
            <div key={m.key} onClick={() => handleOpenDetails(m.key, m)} className={`border border-gray-200 rounded-xl overflow-hidden hover:border-blue-500 hover:shadow-sm transition cursor-pointer flex flex-col justify-between h-28 bg-white ${method===m.key ? 'ring-2 ring-blue-200' : ''}`}>
              <div className="p-3 flex justify-center items-center flex-1">
                {m.logo ? <img src={m.logo} alt={m.label} style={{maxHeight:40, objectFit:'contain'}} /> : <span className="text-pink-600 font-black text-xl italic tracking-tight">{m.label}</span>}
              </div>
              <div className="bg-gray-50 border-t border-gray-100 py-2 text-center text-xs text-gray-600 font-medium">{m.label} {m.meta?.type ? m.meta.type : ''}</div>
            </div>
          ))}
        </div>

        {/* bottom pay label for desktop: non-interactive full-width inside card */}
        <div className="hidden md:block mt-4">
          <div className="w-full bg-blue-100 text-blue-600 font-bold py-3.5 rounded-xl text-center text-lg tracking-wide shadow-sm select-none">
            {amount ? `Pay ${amount} BDT` : 'Pay'}
          </div>
        </div>
      </div>

      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-auto md:mx-auto max-w-2xl z-40 md:hidden">
        <div className="bg-blue-100 text-blue-600 font-bold py-3.5 rounded-xl text-center text-lg tracking-wide shadow-sm select-none">
          {amount ? `Pay ${amount} BDT` : 'Pay'}
        </div>
      </div>

    </div>
  );
}
