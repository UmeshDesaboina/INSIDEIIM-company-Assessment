const yahooFinance = require('./services/yahooFinance');
const newsService = require('./services/newsService');
const tavilyService = require('./services/tavilyService');
const { analyzeWithLangChain, keywordSentiment } = require('./agents/investmentAgent');

require('dotenv').config({ path: '../.env' });

async function testReportGen() {
  try {
    const symbol = 'AAPL';
    console.log('1. Fetching yahooFinance profile...');
    const profile = await yahooFinance.getCompanyProfile(symbol);
    if (!profile) {
      console.error('Failed to fetch company profile');
      return;
    }
    console.log('Profile basic data:', {
      name: profile.companyInfo.name,
      price: profile.financialData.currentPrice,
      metaHigh: profile.financialData.fiftyTwoWeekHigh,
      metaLow: profile.financialData.fiftyTwoWeekLow,
      marketCap: profile.financialData.marketCap
    });

    console.log('2. Fetching historical prices...');
    const prices = await yahooFinance.getHistoricalPrices(symbol);
    profile.financialData.priceHistory = prices;
    console.log(`Fetched ${prices.length} price points`);

    console.log('3. Fetching news...');
    const newsArticles = await newsService.searchNews(profile.companyInfo.name);
    console.log(`Fetched ${newsArticles.length} news articles`);

    const newsWithSentiment = newsArticles.map(a => ({
      ...a,
      sentiment: keywordSentiment([a]).overall
    }));

    console.log('4. Searching web via Tavily...');
    const webData = await tavilyService.searchWeb(profile.companyInfo.name);
    console.log('Tavily search answers/results fetched');

    console.log('5. Running AI analysis...');
    const analysis = await analyzeWithLangChain(profile, newsWithSentiment, webData);
    console.log('Analysis recommendation:', analysis.recommendation);
  } catch (err) {
    console.error('Detailed report gen test error:', err);
  }
}

testReportGen();
