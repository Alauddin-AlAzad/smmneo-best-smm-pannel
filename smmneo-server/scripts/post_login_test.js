(async () => {
  try {
    const res = await fetch('http://localhost:3000/smmsecure/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alaudinf92@gmail.com', password: 'Alauddinnn@smmsecure' }),
    });
    const text = await res.text();
    console.log('STATUS:', res.status);
    console.log('HEADERS:', JSON.stringify(Object.fromEntries(res.headers.entries()), null, 2));
    console.log('BODY:', text);
  } catch (err) {
    console.error('ERROR:', err);
    process.exitCode = 1;
  }
})();
