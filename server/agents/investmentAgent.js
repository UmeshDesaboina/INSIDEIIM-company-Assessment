const { generateStructuredJSON, generateContent } = require('../services/geminiService');
const outputParser = require('./outputParser');
const offlineData = require('../services/offlineData');

const ANALYZE_PROMPT = `You are an expert financial analyst AI. Analyze the provided company data and give an investment recommendation.

Company Data:
{companyData}

News Articles:
{newsData}

Web Research:
{webData}

Rules:
1. ONLY analyze the data provided above. Do NOT use any external knowledge.
2. If data fields are null or missing, state "Data not available" instead of guessing.
3. Be conservative in your assessment.
4. Provide clear, data-driven reasoning.
5. The recommendation must be based ONLY on the data provided.
6. For newsSentiment, count how many news articles have positive, negative, and neutral sentiment based on their titles and summaries.`;

const keywordSentiment = (articles) => {
  const positiveWords = ['surge', 'growth', 'profit', 'record', 'positive', 'strong', 'bullish', 'upgrade', 'beat', 'exceed', 'gain', 'rally', 'outperform', 'innovation', 'expansion', 'momentum', 'optimistic', 'recovery', 'breakthrough', 'dividend', 'buyback'];
  const negativeWords = ['decline', 'loss', 'drop', 'fall', 'negative', 'bearish', 'downgrade', 'miss', 'below', 'debt', 'lawsuit', 'fine', 'regulatory', 'investigation', 'volatile', 'uncertainty', 'risk', 'slowdown', 'recession', 'cut', 'layoff', 'restructuring', 'sell-off', 'plunge', 'crash'];
  let positive = 0, negative = 0, neutral = 0;

  for (const article of articles || []) {
    const text = `${article.title || ''} ${article.summary || ''}`.toLowerCase();
    const posCount = positiveWords.filter(w => text.includes(w)).length;
    const negCount = negativeWords.filter(w => text.includes(w)).length;
    if (posCount > negCount) positive++;
    else if (negCount > posCount) negative++;
    else neutral++;
  }

  const overall = positive > negative ? 'positive' : negative > positive ? 'negative' : 'neutral';
  return { positive, negative, neutral, overall };
};

const computeFallbackAnalysis = (companyData, newsArticles) => {
  const price = companyData?.financialData?.currentPrice || 0;
  const high52 = companyData?.financialData?.fiftyTwoWeekHigh || 0;
  const low52 = companyData?.financialData?.fiftyTwoWeekLow || 0;
  const priceHistory = companyData?.financialData?.priceHistory || [];
  const name = companyData?.companyInfo?.name || 'the company';
  const industry = companyData?.companyInfo?.industry || '';
  const sector = companyData?.companyInfo?.sector || '';
  const marketCap = companyData?.financialData?.marketCap || 0;
  const peRatio = companyData?.financialData?.peRatio;

  const midpoint52 = (high52 + low52) / 2;
  const range52 = high52 - low52;
  const positionInRange = range52 > 0 ? (price - low52) / range52 : 0.5;

  let trend = 'neutral';
  let trendScore = 50;
  let priceChange = 0;
  if (priceHistory.length >= 2) {
    const first = priceHistory[0];
    const last = priceHistory[priceHistory.length - 1];
    priceChange = ((last - first) / first) * 100;
    if (priceChange > 10) { trend = 'bullish'; trendScore = Math.min(85, 50 + Math.round(priceChange * 1.5)); }
    else if (priceChange > 5) { trend = 'moderately bullish'; trendScore = 65; }
    else if (priceChange < -10) { trend = 'bearish'; trendScore = Math.max(15, 50 + Math.round(priceChange * 1.5)); }
    else if (priceChange < -5) { trend = 'moderately bearish'; trendScore = 35; }
  }

  let momentum = 'neutral';
  if (priceHistory.length >= 3) {
    const recent = priceHistory.slice(-3);
    if (recent[2] > recent[1] && recent[1] > recent[0]) momentum = 'positive';
    else if (recent[2] < recent[1] && recent[1] < recent[0]) momentum = 'negative';
  }

  const avgVolume = priceHistory.length >= 5
    ? priceHistory.slice(-5).reduce((a, b) => a + b, 0) / 5
    : 0;
  const volatility = range52 > 0 && price > 0 ? range52 / price : 0;

  let recommendationType = 'HOLD';
  
  if (positionInRange > 0.8 && trend === 'bullish') {
    recommendationType = 'INVEST';
  } else if (positionInRange < 0.2 && trend === 'bearish') {
    recommendationType = 'PASS';
  } else if (positionInRange < 0.3 && momentum === 'positive') {
    recommendationType = 'INVEST';
  } else if (positionInRange > 0.7 && momentum === 'negative') {
    recommendationType = 'PASS';
  } else if (positionInRange > 0.6 && priceChange > 5) {
    recommendationType = 'INVEST';
  } else if (positionInRange < 0.4 && priceChange < -5) {
    recommendationType = 'PASS';
  }

  // Calculate detailed metric scores
  const revenueGrowth = companyData?.financialData?.revenue?.growth || 0.1;
  const netIncomeGrowth = companyData?.financialData?.netIncome?.growth || 0.1;
  const growthScore = Math.min(98, Math.max(10, Math.round(60 + (revenueGrowth * 100) + (netIncomeGrowth * 30))));

  const margin = companyData?.financialData?.operatingMargin || 0.15;
  const roe = companyData?.financialData?.roe || 0.15;
  const profitabilityScore = Math.min(98, Math.max(10, Math.round(55 + (margin * 120) + (roe * 80))));

  let valuationScore = 70;
  if (peRatio) {
    if (peRatio < 15) valuationScore = 92;
    else if (peRatio < 25) valuationScore = 82;
    else if (peRatio < 35) valuationScore = 68;
    else valuationScore = Math.max(15, 68 - (peRatio - 35));
  } else {
    valuationScore = 65;
  }

  const technicalScore = Math.min(98, Math.max(10, Math.round(trendScore + (momentum === 'positive' ? 10 : momentum === 'negative' ? -10 : 0))));

  const sentiment = keywordSentiment(newsArticles);
  const sentimentScore = Math.min(98, Math.max(10, Math.round(55 + (sentiment.positive - sentiment.negative) * 12)));

  const d2e = companyData?.financialData?.ratios?.debtToEquity || 0.5;
  const riskScore = Math.min(98, Math.max(10, Math.round(85 - (volatility * 60) - (d2e > 2 ? 20 : d2e * 8))));

  const fundamentalsScore = Math.round((growthScore + profitabilityScore + riskScore) / 3);

  // Compute final scores
  const investmentScore = Math.min(98, Math.max(10, Math.round(fundamentalsScore * 0.4 + technicalScore * 0.3 + valuationScore * 0.2 + sentimentScore * 0.1)));
  const confidenceScore = Math.min(98, Math.max(10, Math.round(fundamentalsScore * 0.3 + technicalScore * 0.3 + sentimentScore * 0.2 + valuationScore * 0.2)));

  const direction = positionInRange > 0.5 ? 'above' : 'below';
  const priceDesc = range52 > 0
    ? `${name} is trading at $${price.toFixed(2)}, which is ${direction} its 52-week midpoint of $${midpoint52.toFixed(2)}.`
    : `${name} is trading at $${price.toFixed(2)}.`;

  const trendDesc = trend !== 'neutral'
    ? `The price trend over the available history shows ${trend} movement (${priceChange > 0 ? '+' : ''}${priceChange.toFixed(1)}%).`
    : 'The price appears relatively stable over the observed period.';

  const momentumDesc = momentum !== 'neutral'
    ? `Recent three-period momentum is ${momentum}.`
    : 'No clear short-term momentum signal.';

  const peDesc = peRatio != null
    ? `The P/E ratio is ${peRatio.toFixed(2)}.`
    : 'P/E ratio data is not available.';

  const newsCount = newsArticles?.length || 0;

  const strengths = [`52-week range: $${low52.toFixed(2)} - $${high52.toFixed(2)}`, `Current price: $${price.toFixed(2)}`];
  const weaknesses = [];
  const risks = ['Market volatility', 'Sector-specific risks', 'Macroeconomic uncertainty'];

  if (volatility > 0.4) strengths.push(`Moderate volatility suggests trading opportunities`);
  if (marketCap > 10e9) strengths.push(`Large market cap of $${(marketCap / 1e9).toFixed(1)}B indicates established market presence`);
  if (industry) strengths.push(`Operates in the ${industry} sector`);
  if (peRatio != null && peRatio < 20 && peRatio > 0) strengths.push(`Attractive P/E ratio of ${peRatio.toFixed(2)}`);
  if (peRatio != null && peRatio > 30) weaknesses.push(`Elevated P/E ratio of ${peRatio.toFixed(2)} suggests high valuation`);

  if (newsCount === 0) weaknesses.push('No recent news available for sentiment analysis');
  if (sentiment.negative > sentiment.positive) weaknesses.push(`Majority of recent news sentiment is negative (${sentiment.negative} of ${newsCount} articles)`);

  if (!priceHistory || priceHistory.length < 12) weaknesses.push('Limited price history data for comprehensive trend analysis');

  const threatText = volatility > 0.5
    ? 'High price volatility may indicate increased risk exposure'
    : 'Market volatility, macroeconomic factors, sector-specific risks';

  if (sector) risks.push(`Sector: ${sector}`);
  risks.push(threatText);

  const opportunityText = positionInRange > 0.7
    ? `Strong price momentum - potential for continued growth if positive catalysts emerge`
    : positionInRange < 0.3
      ? `Stock near 52-week lows - potential value opportunity if fundamentals remain strong`
      : `Balanced risk-reward profile at current levels`;

  return {
    aiAnalysis: {
      executiveSummary: `${name} analysis based on available market data. ${priceDesc} ${trendDesc} ${momentumDesc} ${sentiment.overall === 'positive' ? 'News sentiment is predominantly positive.' : sentiment.overall === 'negative' ? 'News sentiment is predominantly negative.' : 'News sentiment is mixed.'} Based on technical position and price action, the recommendation is ${recommendationType}.`,
      businessAnalysis: `Financial data shows ${name} with a current price of $${price.toFixed(2)}. The 52-week range is $${low52.toFixed(2)} - $${high52.toFixed(2)}. ${peDesc} ${industry ? `The company operates in the ${industry} industry.` : ''} ${newsCount > 0 ? `${newsCount} recent news articles have been analyzed for sentiment, with ${sentiment.positive} positive, ${sentiment.neutral} neutral, and ${sentiment.negative} negative.` : ''}`,
      growthAnalysis: `Based on price history spanning ${priceHistory.length} data points, the stock shows a ${trend} trajectory with a ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(1)}% change over the measured period. ${momentumDesc} ${volatility > 0.4 ? 'The stock exhibits notable price variability which may present both opportunities and risks.' : 'The stock exhibits relatively stable price action.'}`,
      competitiveAnalysis: `Market positioning analysis: ${name} trades at ${Math.round(positionInRange * 100)}% of its 52-week range (${positionInRange > 0.5 ? 'upper half' : 'lower half'}), suggesting ${positionInRange > 0.5 ? 'above-average' : 'below-average'} relative valuation. ${marketCap > 10e9 ? `With a market cap of $${(marketCap / 1e9).toFixed(1)}B, it has significant market presence.` : ''}`,
      swot: {
        strengths: [...strengths],
        weaknesses: [...weaknesses],
        opportunities: [opportunityText],
        threats: [...risks.slice(0, 3)]
      },
      riskAnalysis: `Volatility assessment based on 52-week range of $${low52.toFixed(2)} - $${high52.toFixed(2)} ($${range52.toFixed(2)} range). The stock's volatility ratio is ${(volatility * 100).toFixed(1)}% of its current price. ${volatility > 0.5 ? 'This indicates elevated price variability and higher risk.' : volatility < 0.2 ? 'This indicates relatively low price variability and lower risk.' : 'This indicates moderate price variability.'} ${sentiment.negative > 0 ? `${sentiment.negative} of ${newsCount} recent news articles carry negative sentiment.` : ''}`,
      futureOutlook: `Short to medium-term outlook is ${recommendationType === 'INVEST' ? 'positive' : recommendationType === 'PASS' ? 'cautious' : 'neutral'} based on current technical indicators and market data.${momentum === 'positive' ? ' Recent positive momentum suggests potential near-term strength.' : ''}${momentum === 'negative' ? ' Recent negative momentum suggests potential near-term weakness.' : ''} ${sentiment.overall === 'positive' ? 'Favorable news sentiment supports a positive outlook.' : sentiment.overall === 'negative' ? 'Caution is warranted given the negative news sentiment.' : 'Market data suggests a wait-and-see approach.'}`,
      marketPosition: `Currently positioned at ${Math.round(positionInRange * 100)}% of its 52-week range. The stock has a 52-week range of $${low52.toFixed(2)} - $${high52.toFixed(2)}. ${marketCap > 0 ? `Market capitalization is $${marketCap >= 1e12 ? (marketCap / 1e12).toFixed(2) + 'T' : (marketCap / 1e9).toFixed(2) + 'B'}.` : ''}`
    },
    recommendation: {
      type: recommendationType,
      confidenceScore: Math.min(95, Math.max(10, confidenceScore)),
      investmentScore: Math.min(95, Math.max(10, investmentScore)),
      scoreBreakdown: {
        fundamentals: fundamentalsScore,
        technical: technicalScore,
        valuation: valuationScore,
        profitability: profitabilityScore,
        growth: growthScore,
        sentiment: sentimentScore,
        risk: riskScore
      },
      reasoning: `Based on technical and sentiment analysis: price at ${Math.round(positionInRange * 100)}% of 52-week range, ${trend} trend (${priceChange > 0 ? '+' : ''}${priceChange.toFixed(1)}%), ${momentum} momentum. News sentiment: ${sentiment.overall}. Recommendation: ${recommendationType}.`,
      strengths: [...strengths.slice(0, 3)],
      weaknesses: [...weaknesses.slice(0, 2)],
      risks: [...risks.slice(0, 3)]
    },
    newsSentiment: sentiment
  };
};

const analyzeWithLangChain = async (companyData, newsArticles, webData) => {
  try {
    const articlesWithKeywordSentiment = (newsArticles || []).map(a => ({
      ...a,
      sentiment: keywordSentiment([a]).overall
    }));

    const prompt = ANALYZE_PROMPT
      .replace('{companyData}', JSON.stringify(companyData, null, 2))
      .replace('{newsData}', JSON.stringify(articlesWithKeywordSentiment, null, 2))
      .replace('{webData}', JSON.stringify(webData, null, 2));

    const analysis = await generateStructuredJSON(prompt, outputParser.ANALYSIS_SCHEMA);
    return analysis;
  } catch (error) {
    console.warn('Gemini AI analysis failed. Using offline high-fidelity fallback for:', companyData.symbol || (companyData.companyInfo && companyData.companyInfo.name));
    const symbol = companyData.symbol || (companyData.companyInfo && companyData.companyInfo.name) || '';
    const fallbackData = offlineData.getPrecompiledCompanyProfile(symbol);
    if (fallbackData && fallbackData.aiAnalysis) {
      return {
        aiAnalysis: fallbackData.aiAnalysis,
        recommendation: fallbackData.recommendation,
        newsSentiment: fallbackData.newsSentiment
      };
    }
    return computeFallbackAnalysis(companyData, newsArticles);
  }
};

module.exports = { analyzeWithLangChain, keywordSentiment };
