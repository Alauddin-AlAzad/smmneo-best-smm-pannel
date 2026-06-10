const http = require('http');
const data = JSON.stringify({
  email: 'test@example.com',
  serviceName: 'TikTok Video Views Test',
  providerServiceId: 19102,
  link: 'https://example.com/video/1',
  quantity: 100,
  chargeAmount: 0.1,
  currency: 'USD'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/orders/create',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    console.log(body);
  });
});

req.on('error', (e) => console.error('Request error', e));
req.write(data);
req.end();
