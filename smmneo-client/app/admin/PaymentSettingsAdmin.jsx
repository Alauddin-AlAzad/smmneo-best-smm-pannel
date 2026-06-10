import React, { useEffect, useState } from 'react';
import { getPaymentSettings, savePaymentSettings } from '../services/paymentAPI';

export default function PaymentSettingsAdmin(){
  const [settings, setSettings] = useState({ bkash:{}, nagad:{}, rocket:{} });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(()=>{
    (async ()=>{
      const json = await getPaymentSettings();
      if (json && json.success && json.data) setSettings(json.data);
    })();
  },[]);

  function updateField(method, field, value){
    setSettings(prev=>({ ...prev, [method]: { ...(prev[method]||{}), [field]: value } }));
  }

  async function handleSave(){
    setLoading(true); setMessage(null);
    try{
      const resp = await savePaymentSettings(settings);
      if (resp && resp.success) setMessage({type:'success', text:'Saved'});
      else setMessage({type:'error', text: resp.error || 'Failed'});
    }catch(err){ setMessage({type:'error', text:err.message||'Failed'}); }
    finally{ setLoading(false); }
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-lg font-bold mb-4">Payment Settings</h2>
      <div className="grid grid-cols-1 gap-4">
        {['bkash','nagad','rocket'].map((m)=> (
          <div key={m} className="p-4 border rounded">
            <h3 className="font-semibold capitalize">{m}</h3>
            <div className="mt-2 grid grid-cols-1 gap-2">
              <input value={settings[m]?.number||''} onChange={(e)=>updateField(m,'number',e.target.value)} placeholder="Number" className="w-full rounded-md border px-3 py-2" />
              <select value={settings[m]?.accountType||'Personal'} onChange={(e)=>updateField(m,'accountType',e.target.value)} className="w-full rounded-md border px-3 py-2">
                <option>Personal</option>
                <option>Merchant</option>
              </select>
              <textarea value={settings[m]?.instruction||''} onChange={(e)=>updateField(m,'instruction',e.target.value)} placeholder="Instruction" className="w-full rounded-md border px-3 py-2" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2">
        <button onClick={handleSave} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">{loading ? 'Saving...' : 'Save'}</button>
        {message && <div className={`${message.type==='success'?'text-green-600':'text-red-600'}`}>{message.text}</div>}
      </div>
    </div>
  );
}
