const axios = require('axios');

const TAVILY_API_BASE = 'https://api.tavily.com';

const searchWeb = async (query) => {
  try {
    const response = await axios.post(`${TAVILY_API_BASE}/search`, {
      api_key: process.env.TAVILY_API_KEY,
      query: `${query} company financial analysis 2025 2026`,
      search_depth: 'advanced',
      max_results: 5,
      include_answer: true
    }, { proxy: false });

    return {
      answer: response.data.answer,
      results: response.data.results?.map(r => ({
        title: r.title,
        content: r.content,
        url: r.url
      })) || []
    };
  } catch (error) {
    console.error('Tavily search error:', error.message);
    return { answer: '', results: [] };
  }
};

module.exports = { searchWeb };
