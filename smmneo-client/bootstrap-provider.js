// Run this in browser console at http://localhost:5173 to auto-configure test provider
(function() {
  const testProvider = {
    id: Date.now(),
    name: 'SMMSecure',
    apiUrl: 'https://smmssecure.com/api/v2',
    apiKey: 'fe8d0ffe500cfd6a7472162bb3ed93ec',
    disableSync: false,
    loginUsername: '',
    loginPassword: ''
  };

  localStorage.setItem('smmssecure_providers', JSON.stringify([testProvider]));})();
