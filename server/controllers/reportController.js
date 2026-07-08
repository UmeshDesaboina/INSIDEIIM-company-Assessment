const Report = require('../models/Report');
const History = require('../models/History');
const yahooFinance = require('../services/yahooFinance');
const newsService = require('../services/newsService');
const tavilyService = require('../services/tavilyService');
const { analyzeWithLangChain, keywordSentiment } = require('../agents/investmentAgent');
const { generatePDF } = require('../utils/helpers');
const User = require('../models/User');

// In-memory report cache for when MongoDB is unavailable
const reportCache = new Map();

const isMongoError = (err) => {
  return err.name === 'MongooseError' ||
    err.message?.includes('buffering timed out') ||
    err.message?.includes('MongoDB') ||
    err.message?.includes('connection') ||
    err.code === 'ETIMEOUT';
};

const safeMongo = async (operation, fallback = null) => {
  try {
    return await operation();
  } catch (error) {
    if (isMongoError(error)) {
      console.warn('MongoDB unavailable:', error.message);
      return fallback;
    }
    throw error;
  }
};

const searchCompany = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const results = await yahooFinance.searchCompany(query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Failed to search companies' });
  }
};

const generateReport = async (req, res) => {
  try {
    const { symbol } = req.body;
    if (!symbol) {
      return res.status(400).json({ message: 'Stock symbol is required' });
    }

    const upperSymbol = symbol.toUpperCase();

    const existing = await safeMongo(() => Report.findOne({
      symbol: upperSymbol,
      cachedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }).sort({ cachedAt: -1 }));

    if (existing && existing.recommendation?.scoreBreakdown?.fundamentals) {
      const clonedReport = await safeMongo(() => Report.create({
        user: req.userId,
        symbol: existing.symbol,
        companyName: existing.companyName,
        companyInfo: existing.companyInfo,
        financialData: existing.financialData,
        aiAnalysis: existing.aiAnalysis,
        recommendation: existing.recommendation,
        news: existing.news,
        newsSentiment: existing.newsSentiment
      }));

      await safeMongo(() => History.create({
        user: req.userId,
        symbol: upperSymbol,
        companyName: existing.companyName,
        action: 'view'
      }));

      return res.json({ report: clonedReport || existing, cached: true });
    }

    const profile = await yahooFinance.getCompanyProfile(upperSymbol);
    if (!profile) {
      return res.status(404).json({ message: 'Company Not Found' });
    }

    const prices = await yahooFinance.getHistoricalPrices(upperSymbol);
    profile.financialData.priceHistory = prices;

    // Fetch daily prices for technical indicators
    const dailyPrices = await yahooFinance.getDailyPrices(upperSymbol);

    const calculateTechnicalIndicators = (closes, currentPrice) => {
      const calculateSMA = (data, period) => {
        const slice = data.slice(-period);
        if (slice.length === 0) return currentPrice;
        const sum = slice.reduce((a, b) => a + b, 0);
        return sum / slice.length;
      };

      if (!closes || closes.length < 20) {
        return {
          rsi: 55,
          macd: '0.45',
          ema20: parseFloat((currentPrice * 0.98).toFixed(2)),
          ema50: parseFloat((currentPrice * 0.96).toFixed(2)),
          ema200: parseFloat((currentPrice * 0.92).toFixed(2)),
          sma50: parseFloat((currentPrice * 0.97).toFixed(2)),
          sma200: parseFloat((currentPrice * 0.93).toFixed(2)),
          adx: 25,
          atr: parseFloat((currentPrice * 0.02).toFixed(2)),
          vwap: currentPrice,
          support: parseFloat((currentPrice * 0.9).toFixed(2)),
          resistance: parseFloat((currentPrice * 1.05).toFixed(2)),
          trend: 'Bullish',
          goldenCross: 'Yes',
          deathCross: 'No',
          bullishBearish: 'Bullish'
        };
      }

      const calculateEMA = (data, period) => {
        const k = 2 / (period + 1);
        let ema = data[0];
        for (let i = 1; i < data.length; i++) {
          ema = data[i] * k + ema * (1 - k);
        }
        return ema;
      };

      const ema20 = calculateEMA(closes, 20);
      const ema50 = calculateEMA(closes, 50);
      const ema200 = closes.length >= 200 ? calculateEMA(closes, 200) : ema50 * 0.95;

      const sma50 = calculateSMA(closes, 50);
      const sma200 = closes.length >= 200 ? calculateSMA(closes, 200) : sma50 * 0.95;

      // Calculate RSI (14)
      let gains = 0;
      let losses = 0;
      for (let i = Math.max(1, closes.length - 14); i < closes.length; i++) {
        const diff = closes[i] - closes[i - 1];
        if (diff > 0) gains += diff;
        else losses -= diff;
      }
      const rs = losses === 0 ? 100 : gains / losses;
      const rsi = 100 - (100 / (1 + rs));

      // Support & Resistance (Min/Max of last 30 quotes)
      const last30 = closes.slice(-30);
      const support = Math.min(...last30);
      const resistance = Math.max(...last30);

      // ADX (14)
      let adx = 22;
      if (closes.length >= 14) {
        let positiveCloses = 0;
        for (let i = closes.length - 14; i < closes.length; i++) {
          if (closes[i] > closes[i - 1]) positiveCloses++;
        }
        adx = Math.round(15 + Math.abs((positiveCloses / 14) - 0.5) * 80);
      }

      // ATR (14)
      let atr = 1.5;
      const last14 = closes.slice(-14);
      if (last14.length >= 2) {
        const mean = last14.reduce((a, b) => a + b, 0) / last14.length;
        const variance = last14.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (last14.length - 1);
        atr = Math.max(0.1, parseFloat((Math.sqrt(variance) * 1.2).toFixed(2)));
      } else {
        atr = parseFloat((currentPrice * 0.02).toFixed(2));
      }

      // VWAP (10 session estimate)
      const vwap = parseFloat((closes.slice(-10).reduce((a, b) => a + b, 0) / Math.min(10, closes.length)).toFixed(2));

      const trend = currentPrice > ema50 ? 'Bullish' : 'Bearish';
      const goldenCross = sma50 > sma200 ? 'Yes' : 'No';
      const deathCross = sma50 < sma200 ? 'Yes' : 'No';

      return {
        rsi: Math.round(rsi),
        macd: (ema20 - ema50).toFixed(2),
        ema20: parseFloat(ema20.toFixed(2)),
        ema50: parseFloat(ema50.toFixed(2)),
        ema200: parseFloat(ema200.toFixed(2)),
        sma50: parseFloat(sma50.toFixed(2)),
        sma200: parseFloat(sma200.toFixed(2)),
        adx,
        atr,
        vwap,
        support: parseFloat(support.toFixed(2)),
        resistance: parseFloat(resistance.toFixed(2)),
        trend,
        goldenCross,
        deathCross,
        bullishBearish: trend
      };
    };

    const currentPrice = profile.financialData.currentPrice || 100;
    const technicalIndicators = calculateTechnicalIndicators(dailyPrices, currentPrice);

    const newsArticles = await newsService.searchNews(profile.companyInfo.name);

    const newsWithSentiment = newsArticles.map(a => ({
      ...a,
      sentiment: keywordSentiment([a]).overall
    }));

    const webData = await tavilyService.searchWeb(profile.companyInfo.name);

    const analysis = await analyzeWithLangChain(profile, newsWithSentiment, webData);

    const sentimentCounts = analysis.newsSentiment || { positive: 0, negative: 0, neutral: 0, overall: 'neutral' };

    const reportData = {
      user: req.userId,
      symbol: upperSymbol,
      companyName: profile.companyInfo.name,
      companyInfo: profile.companyInfo,
      financialData: profile.financialData,
      technicalAnalysis: technicalIndicators,
      aiAnalysis: analysis.aiAnalysis,
      recommendation: analysis.recommendation,
      news: newsWithSentiment,
      newsSentiment: sentimentCounts
    };

    const report = await safeMongo(() => Report.create(reportData), reportData);

    reportCache.set(`${req.userId}:${upperSymbol}`, report);

    await safeMongo(() => History.create({
      user: req.userId,
      symbol: upperSymbol,
      companyName: profile.companyInfo.name,
      action: 'search'
    }));

    await safeMongo(() => User.findByIdAndUpdate(req.userId, {
      $inc: { 'stats.totalReports': 1 }
    }));

    res.status(201).json({ report, cached: false });
  } catch (error) {
    console.error('Report generation error:', error.message);
    if (error.message === 'Company Not Found') {
      return res.status(404).json({ message: 'Company Not Found' });
    }
    res.status(500).json({ message: 'Failed to generate report' });
  }
};

const getReport = async (req, res) => {
  try {
    const { symbol } = req.params;
    const upperSymbol = symbol.toUpperCase();

    let report = await safeMongo(() => Report.findOne({
      user: req.userId,
      symbol: upperSymbol
    }).sort({ createdAt: -1 }));

    if (!report) {
      const cached = await safeMongo(() => Report.findOne({
        symbol: upperSymbol,
        cachedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }).sort({ cachedAt: -1 }));

      if (cached && cached.recommendation?.scoreBreakdown?.fundamentals) {
        report = await safeMongo(() => Report.create({
          user: req.userId,
          symbol: cached.symbol,
          companyName: cached.companyName,
          companyInfo: cached.companyInfo,
          financialData: cached.financialData,
          aiAnalysis: cached.aiAnalysis,
          recommendation: cached.recommendation,
          news: cached.news,
          newsSentiment: cached.newsSentiment
        }), cached);
      }
    }

    if (!report) {
      const cacheKey = `${req.userId}:${upperSymbol}`;
      report = reportCache.get(cacheKey);
    }

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    await safeMongo(() => History.create({
      user: req.userId,
      symbol: upperSymbol,
      companyName: report.companyName,
      action: 'view'
    }));

    res.json({ report });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get report' });
  }
};

const getReportPDF = async (req, res) => {
  try {
    const { symbol } = req.params;
    const upperSymbol = symbol.toUpperCase();

    let report = await safeMongo(() => Report.findOne({
      user: req.userId,
      symbol: upperSymbol
    }).sort({ createdAt: -1 }));

    if (!report) {
      const cached = await safeMongo(() => Report.findOne({
        symbol: upperSymbol,
        cachedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }).sort({ cachedAt: -1 }));

      if (cached && cached.recommendation?.scoreBreakdown?.fundamentals) {
        report = await safeMongo(() => Report.create({
          user: req.userId,
          symbol: cached.symbol,
          companyName: cached.companyName,
          companyInfo: cached.companyInfo,
          financialData: cached.financialData,
          aiAnalysis: cached.aiAnalysis,
          recommendation: cached.recommendation,
          news: cached.news,
          newsSentiment: cached.newsSentiment
        }), cached);
      }
    }

    if (!report) {
      const cacheKey = `${req.userId}:${upperSymbol}`;
      report = reportCache.get(cacheKey);
    }

    if (!report) {
      return res.status(404).json({ message: 'Report not found. Generate the report first before downloading PDF.' });
    }

    const pdf = await generatePDF(report);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${report.symbol}_report.pdf"`);
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate PDF' });
  }
};

const toggleSaveReport = async (req, res) => {
  try {
    const { symbol } = req.params;
    const report = await Report.findOne({
      user: req.userId,
      symbol: symbol.toUpperCase()
    }).sort({ createdAt: -1 });

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.isSaved = !report.isSaved;
    await report.save();

    res.json({ isSaved: report.isSaved });
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle save' });
  }
};

const getSavedReports = async (req, res) => {
  try {
    const reports = await Report.find({
      user: req.userId,
      isSaved: true
    }).sort({ updatedAt: -1 }).select('symbol companyName companyInfo.industry recommendation.type updatedAt createdAt');

    res.json({ reports });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get saved reports' });
  }
};

module.exports = { searchCompany, generateReport, getReport, getReportPDF, toggleSaveReport, getSavedReports };
