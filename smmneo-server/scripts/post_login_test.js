(async () => {
  try {
    const res = await fetch('http://localhost:3000/smmsecure/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alaudinf92@gmail.com', password: 'Alauddinnn@smmsecure' }),
    });
    const text = await res.text();  } catch (err) {    process.exitCode = 1;
  }
})();
