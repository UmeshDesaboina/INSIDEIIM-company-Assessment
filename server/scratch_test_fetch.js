const fetch = require('node-fetch').default || globalThis.fetch;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function run() {
  try {
    const url = 'https://www.google.com';
    console.log('Fetching:', url);
    const res = await fetch(url);
    console.log('Status:', res.status, res.statusText);
    console.log('Headers:');
    for (const [key, value] of res.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

run();
