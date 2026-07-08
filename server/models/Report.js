const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  companyName: {
    type: String,
    required: true
  },
  companyInfo: {
    name: String,
    logo: String,
    industry: String,
    ceo: String,
    website: String,
    employees: Number,
    founded: String,
    headquarters: String,
    description: String,
    sector: String,
    country: String,
    exchange: String
  },
  financialData: {
    revenue: { current: Number, previous: Number, growth: Number },
    netIncome: { current: Number, previous: Number, growth: Number },
    marketCap: Number,
    currentPrice: Number,
    eps: Number,
    peRatio: Number,
    dividend: { yield: Number, rate: Number },
    debt: Number,
    cashFlow: Number,
    operatingMargin: Number,
    roe: Number,
    roa: Number,
    fiftyTwoWeekHigh: Number,
    fiftyTwoWeekLow: Number,
    cash: Number,
    sharesOutstanding: Number,
    ratios: {
      debtToEquity: Number,
      currentRatio: Number,
      quickRatio: Number,
      interestCoverage: Number,
      priceToBook: Number,
      pegRatio: Number,
      evToEbitda: Number,
      evToSales: Number,
      returnOnInvestedCapital: Number,
      grossMargin: Number,
      netMargin: Number
    },
    revenueHistory: [Number],
    profitHistory: [Number],
    priceHistory: [Number],
    operatingCashFlowHistory: [Number],
    freeCashFlowHistory: [Number],
    epsGrowthHistory: [Number],
    debtTrendHistory: [Number],
    operatingMarginHistory: [Number],
    grossMarginHistory: [Number],
    netMarginHistory: [Number],
    roeHistory: [Number],
    roaHistory: [Number],
    quarterlyRevenue: [Number],
    quarterlyEarnings: [Number]
  },
  technicalAnalysis: {
    rsi: Number,
    macd: String,
    ema20: Number,
    ema50: Number,
    ema200: Number,
    sma50: Number,
    sma200: Number,
    adx: Number,
    atr: Number,
    vwap: Number,
    support: Number,
    resistance: Number,
    trend: String,
    goldenCross: String,
    deathCross: String,
    bullishBearish: String
  },
  aiAnalysis: {
    executiveSummary: String,
    businessAnalysis: String,
    growthAnalysis: String,
    competitiveAnalysis: String,
    swot: {
      strengths: [String],
      weaknesses: [String],
      opportunities: [String],
      threats: [String]
    },
    riskAnalysis: String,
    futureOutlook: String,
    marketPosition: String
  },
  recommendation: {
    type: {
      type: String,
      enum: ['INVEST', 'HOLD', 'PASS'],
      required: true
    },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 100
    },
    investmentScore: {
      type: Number,
      min: 0,
      max: 100
    },
    scoreBreakdown: {
      fundamentals: Number,
      technical: Number,
      valuation: Number,
      profitability: Number,
      growth: Number,
      sentiment: Number,
      risk: Number
    },
    reasoning: String,
    strengths: [String],
    weaknesses: [String],
    risks: [String]
  },
  news: [{
    title: String,
    summary: String,
    url: String,
    image: String,
    date: Date,
    source: String,
    sentiment: {
      type: String,
      enum: ['positive', 'negative', 'neutral']
    }
  }],
  newsSentiment: {
    positive: { type: Number, default: 0 },
    negative: { type: Number, default: 0 },
    neutral: { type: Number, default: 0 },
    overall: {
      type: String,
      enum: ['positive', 'negative', 'neutral'],
      default: 'neutral'
    }
  },
  isSaved: {
    type: Boolean,
    default: false
  },
  cachedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

reportSchema.index({ user: 1, symbol: 1 });
reportSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
