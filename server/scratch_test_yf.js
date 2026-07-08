const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

async function test() {
  try {
    const symbol = 'AAPL';
    const summary = await yahooFinance.quoteSummary(symbol, {
      modules: [
        'defaultKeyStatistics',
        'summaryDetail',
        'financialData'
      ]
    });
    console.log('defaultKeyStatistics:', JSON.stringify(summary.defaultKeyStatistics, null, 2));
    console.log('summaryDetail:', JSON.stringify(summary.summaryDetail, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
