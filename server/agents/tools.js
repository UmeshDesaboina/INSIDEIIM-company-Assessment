const { DynamicStructuredTool } = require('langchain/tools');
const yahooFinance = require('../services/yahooFinance');
const newsService = require('../services/newsService');
const tavilyService = require('../services/tavilyService');
const { z } = require('zod');

const financeTool = new DynamicStructuredTool({
  name: 'get_financial_data',
  description: 'Get financial data for a company by stock symbol',
  schema: z.object({
    symbol: z.string().describe('Stock symbol (e.g., AAPL, TSLA)')
  }),
  func: async ({ symbol }) => {
    const profile = await yahooFinance.getCompanyProfile(symbol.toUpperCase());
    if (!profile) {
      return JSON.stringify({ error: 'Company not found' });
    }
    const prices = await yahooFinance.getHistoricalPrices(symbol.toUpperCase());
    profile.financialData.priceHistory = prices;
    return JSON.stringify(profile);
  }
});

const newsTool = new DynamicStructuredTool({
  name: 'get_news',
  description: 'Get latest news articles for a company',
  schema: z.object({
    companyName: z.string().describe('Company name for news search')
  }),
  func: async ({ companyName }) => {
    const articles = await newsService.searchNews(companyName);
    return JSON.stringify(articles);
  }
});

const searchTool = new DynamicStructuredTool({
  name: 'search_web',
  description: 'Search the web for information about a company',
  schema: z.object({
    query: z.string().describe('Search query')
  }),
  func: async ({ query }) => {
    const result = await tavilyService.searchWeb(query);
    return JSON.stringify(result);
  }
});

module.exports = { financeTool, newsTool, searchTool };
