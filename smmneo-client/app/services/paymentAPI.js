import { getApiUrl } from '../config/api.js';

export async function submitPaymentRequest(payload){
  const resp = await fetch(getApiUrl('/api/payments/submit'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  return resp.json().catch(()=>({success:false,error:'Invalid response'}));
}

export async function listPaymentRequests(){
  const resp = await fetch(getApiUrl('/api/add-fund-request'));
  return resp.json().catch(()=>({success:false,error:'Invalid response'}));
}

export async function verifyPaymentRequest(id, payload){
  const resp = await fetch(getApiUrl(`/api/add-fund-request/${id}/verify`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return resp.json().catch(()=>({success:false,error:'Invalid response'}));
}

export async function getPaymentSettings(){
  const resp = await fetch(getApiUrl('/api/payments/payment-settings'));
  return resp.json().catch(()=>({success:false,error:'Invalid response'}));
}

export async function submitAddFundRequest(payload){
  const resp = await fetch(getApiUrl('/api/add-fund-request'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  return resp.json().catch(()=>({success:false,error:'Invalid response'}));
}

export async function savePaymentSettings(payload){
  const resp = await fetch(getApiUrl('/api/payments/payment-settings'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  return resp.json().catch(()=>({success:false,error:'Invalid response'}));
}

export async function getPaymentMethods(){
  const resp = await fetch(getApiUrl('/api/payments/numbers'));
  return resp.json().catch(()=>({success:false,error:'Invalid response'}));
}

export async function savePaymentMethod(paymentData){
  try {
    const resp = await fetch(getApiUrl('/api/payments/numbers'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(paymentData)});
    if (!resp.ok) {
      const error = await resp.text();
      return {success:false, error: `HTTP ${resp.status}: ${error}`};
    }
    const json = await resp.json();
    return json;
  } catch(err) {
    return {success:false, error: err.message};
  }
}
