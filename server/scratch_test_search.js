const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

async function test() {
  try {
    const query = 'Apple';
    console.log('Testing yahooFinance.search for:', query);
    const result = await yahooFinance.search(query);
    console.log('Search keys:', Object.keys(result));
    console.log('First quote:', result.quotes?.[0]);
  } catch (error) {
    console.error('Search Error:', error);
  }
}

test();
