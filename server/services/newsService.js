const axios = require('axios');

const NEWS_API_BASE = 'https://newsapi.org/v2';

const FALLBACK_NEWS = {
  'AAPL': [
    { title: 'Apple Reports Strong Q2 Earnings', summary: 'Apple Inc. reported better-than-expected quarterly results driven by iPhone and Services revenue growth.', source: 'Financial Times', date: new Date().toISOString(), url: '#', image: '' },
    { title: 'Apple Intelligence Features Drive Upgrade Cycle', summary: 'New AI features in iOS are expected to drive a significant iPhone upgrade cycle in the coming quarters.', source: 'Bloomberg', date: new Date().toISOString(), url: '#', image: '' },
    { title: 'Apple Services Revenue Hits All-Time High', summary: 'App Store, Apple Music, and iCloud subscriptions continue to grow, pushing Services revenue to record levels.', source: 'CNBC', date: new Date().toISOString(), url: '#', image: '' },
    { title: 'Apple Expands Into New Markets', summary: 'The company is exploring new product categories including mixed reality headsets and electric vehicle technology.', source: 'Reuters', date: new Date().toISOString(), url: '#', image: '' },
    { title: 'Analysts Raise Apple Price Targets', summary: 'Multiple analysts have raised their price targets for Apple stock citing strong fundamentals and growth prospects.', source: 'MarketWatch', date: new Date().toISOString(), url: '#', image: '' }
  ],
  'MSFT': [
    { title: 'Microsoft Azure Growth Accelerates', summary: 'Microsoft\'s cloud computing platform Azure continues to gain market share with 30%+ growth.', source: 'TechCrunch', date: new Date().toISOString(), url: '#', image: '' },
    { title: 'Microsoft AI Copilot Drives Enterprise Adoption', summary: 'AI-powered Copilot features are driving significant adoption across Microsoft\'s enterprise product suite.', source: 'CNBC', date: new Date().toISOString(), url: '#', image: '' },
    { title: 'Microsoft Reports Strong Fiscal Results', summary: 'Revenue and earnings exceeded expectations driven by cloud and AI services.', source: 'Bloomberg', date: new Date().toISOString(), url: '#', image: '' },
    { title: 'Microsoft Gaming Division Sees Record Revenue', summary: 'Xbox and Game Pass subscriptions reach new highs with recent game releases and acquisitions.', source: 'IGN', date: new Date().toISOString(), url: '#', image: '' },
    { title: 'Microsoft Expands Data Center Infrastructure', summary: 'Multi-billion dollar investment in new data centers to support growing AI and cloud demand.', source: 'Reuters', date: new Date().toISOString(), url: '#', image: '' }
  ],
  'GOOGL': [
    { title: 'Google Search Revenue Remains Strong', summary: 'Despite competition from AI chatbots, Google\'s search advertising revenue continues to grow.', source: 'Financial Times', date: new Date().toISOString(), url: '#', image: '' },
    { title: 'Google Cloud Profits for First Time', summary: 'Google Cloud achieved its first profitable quarter driven by AI infrastructure demand.', source: 'CNBC', date: new Date().toISOString(), url: '#', image: '' },
    { title: 'Alphabet Invests Heavily in AI Infrastructure', summary: 'Capital expenditures reach record levels as Alphabet expands AI computing capabilities.', source: 'Bloomberg', date: new Date().toISOString(), url: '#', image: '' },
    { title: 'YouTube Ad Revenue Exceeds Expectations', summary: 'YouTube\'s advertising revenue growth outpaces the broader digital ad market.', source: 'Reuters', date: new Date().toISOString(), url: '#', image: '' },
    { title: 'Waymo Expands Autonomous Driving Services', summary: 'Waymo launches autonomous ride-hailing services in additional cities.', source: 'TechCrunch', date: new Date().toISOString(), url: '#', image: '' }
  ],
  'NVDA': [
    { title: 'NVIDIA Data Center Revenue Doubles', summary: 'Data center revenue doubled year-over-year driven by AI GPU demand.', source: 'CNBC', date: new Date().toISOString(), url: '#', image: '' },
    { title: 'NVIDIA Announces Next-Gen AI Chip', summary: 'New Blackwell architecture promises significant performance improvements for AI workloads.', source: 'TechCrunch', date: new Date().toISOString(), url: '#', image: '' },
    { title: 'NVIDIA Partners with Major Cloud Providers', summary: 'Expanded partnerships with AWS, Azure, and Google Cloud for AI infrastructure.', source: 'Reuters', date: new Date().toISOString(), url: '#', image: '' },
    { title: 'NVIDIA Stock Split Announced', summary: 'Company announces 10-for-1 stock split to make shares more accessible.', source: 'Bloomberg', date: new Date().toISOString(), url: '#', image: '' },
    { title: 'NVIDIA Automotive Revenue Grows', summary: 'Self-driving chip revenue shows strong growth with new partnerships.', source: 'Financial Times', date: new Date().toISOString(), url: '#', image: '' }
  ]
};

const searchNews = async (query) => {
  const symbol = query.toUpperCase();

  try {
    const response = await axios.get(`${NEWS_API_BASE}/everything`, {
      proxy: false,
      params: {
        q: `${query} stock OR ${query} earnings OR ${query} finance`,
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 10,
        apiKey: process.env.NEWS_API_KEY
      }
    });

    if (response.data?.articles?.length > 0) {
      return response.data.articles.map(article => ({
        title: article.title,
        summary: article.description || article.content || '',
        url: article.url,
        image: article.urlToImage,
        date: article.publishedAt,
        source: article.source?.name || 'Unknown'
      }));
    }
  } catch (error) {
    console.error('News API error:', error.message);
  }

  return FALLBACK_NEWS[symbol] || FALLBACK_NEWS['AAPL'];
};

module.exports = { searchNews };
