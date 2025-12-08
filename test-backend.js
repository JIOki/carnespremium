const http = require('http');

// Test backend health
const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/health',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`Backend Status: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Backend Response:', data);
  });
});

req.on('error', (e) => {
  console.error(`Backend Error: ${e.message}`);
});

req.end();

// Test products endpoint
const productOptions = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/products',
  method: 'GET'
};

const productReq = http.request(productOptions, (res) => {
  console.log(`Products Status: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const products = JSON.parse(data);
      console.log('Products found:', products.data?.products?.length || 0);
    } catch (e) {
      console.log('Products Response:', data.substring(0, 200));
    }
  });
});

productReq.on('error', (e) => {
  console.error(`Products Error: ${e.message}`);
});

productReq.end();