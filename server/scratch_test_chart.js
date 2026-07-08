const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

async function test() {
  try {
    const symbol = 'AAPL';
    console.log('Testing yahooFinance.chart with calculated period1 and period2');
    const period1 = new Date();
    period1.setFullYear(period1.getFullYear() - 1);
    const period2 = new Date();
    
    const result = await yahooFinance.chart(symbol, {
      period1,
      period2,
      interval: '1mo'
    });
    const closes = result.quotes.map(q => q.close).filter(v => v != null);
    console.log('Closes count:', closes.length);
    console.log('Closes:', closes);
    console.log('Meta regularMarketPrice:', result.meta.regularMarketPrice);
    console.log('Meta fiftyTwoWeekHigh:', result.meta.fiftyTwoWeekHigh);
    console.log('Meta fiftyTwoWeekLow:', result.meta.fiftyTwoWeekLow);
  } catch (error) {
    console.error('Chart Error:', error);
  }
}

test();
