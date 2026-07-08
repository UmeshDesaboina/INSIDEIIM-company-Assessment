const axios = require('axios');

const api = axios.create({
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://finance.yahoo.com/'
  }
});

async function test() {
  try {
    const symbol = 'AAPL';
    console.log('Testing query1.finance.yahoo.com/v7/finance/quote for:', symbol);
    const res = await api.get(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`);
    console.log('Quote result:', JSON.stringify(res.data.quoteResponse.result[0], null, 2));
  } catch (error) {
    console.error('v7 quote Error:', error.message);
  }
}

test();
