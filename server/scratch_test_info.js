const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

async function test() {
  try {
    const symbol = 'AAPL';
    console.log('Testing yahooFinance.quote for:', symbol);
    const quote = await yahooFinance.quote(symbol);
    console.log('Quote keys:', Object.keys(quote));
    console.log('Quote details:', {
      longName: quote.longName,
      shortName: quote.shortName,
      regularMarketPrice: quote.regularMarketPrice,
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
      marketCap: quote.marketCap,
      trailingPE: quote.trailingPE,
      epsTrailingTwelveMonths: quote.epsTrailingTwelveMonths
    });
  } catch (error) {
    console.error('Quote Error:', error);
  }
}

test();
