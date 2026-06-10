(async () => {
  const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
  const base = 'http://localhost:3000';
  try {
    // 1) Login
    let r = await fetch(base + '/smmsecure/admin/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alaudinf92@gmail.com', password: 'Alauddinnn@smmsecure' }),
    });
    const loginText = await r.text();
    let loginJson; try { loginJson = JSON.parse(loginText); } catch { loginJson = null; }
    console.log('LOGIN STATUS', r.status, 'BODY', loginJson || loginText);
    const accessToken = loginJson?.data?.accessToken;
    if (!accessToken) {
      console.error('No access token from login');
      process.exit(1);
    }

    // 2) Get CSRF token (and cookie)
    r = await fetch(base + '/smmsecure/admin/auth/csrf-token', { method: 'GET' });
    const setCookie = r.headers.get('set-cookie');
    const csrfText = await r.text();
    let csrfJson; try { csrfJson = JSON.parse(csrfText); } catch { csrfJson = null; }
    console.log('CSRF STATUS', r.status, 'BODY', csrfJson || csrfText);
    const csrfToken = csrfJson?.data?.csrfToken;
    if (!csrfToken) {
      console.error('No csrf token');
      process.exit(1);
    }

    // 3) Create admin
    const newAdmin = { name: 'Test Admin', email: 'testadmin@example.com', password: 'VeryLongPassw0rd!', role: 'admin' };
    r = await fetch(base + '/smmsecure/admin/users/create-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-CSRF-Token': csrfToken,
        'Cookie': setCookie || '',
      },
      body: JSON.stringify(newAdmin),
    });
    const createText = await r.text();
    let createJson; try { createJson = JSON.parse(createText); } catch { createJson = null; }
    console.log('CREATE STATUS', r.status, 'BODY', createJson || createText);
  } catch (err) {
    console.error('ERROR', err);
    process.exit(1);
  }
})();
