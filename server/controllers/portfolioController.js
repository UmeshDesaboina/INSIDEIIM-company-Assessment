const Portfolio = require('../models/Portfolio');
const yahooFinance = require('../services/yahooFinance');
const offlineData = require('../services/offlineData');

const getPortfolio = async (req, res) => {
  try {
    let portfolio = await Portfolio.findOne({ user: req.userId });
    if (!portfolio) {
      // Create empty portfolio for new user
      portfolio = await Portfolio.create({ user: req.userId, holdings: [] });
    }

    if (portfolio.holdings.length === 0) {
      return res.json({
        holdings: [],
        totalValue: 0,
        costBasis: 0,
        gainLoss: 0,
        gainLossPercent: 0,
        dailyChange: 0,
        dailyChangePercent: 0,
        sectorAllocation: {},
        diversificationScore: 100,
        performanceHistory: []
      });
    }

    let totalValue = 0;
    let costBasis = 0;
    let dailyChange = 0;
    const sectorAllocation = {};
    const holdingsDetail = [];
    const priceHistories = [];
    const weights = [];

    // Fetch prices and profiles for all holdings
    for (const h of portfolio.holdings) {
      const profile = await yahooFinance.getCompanyProfile(h.symbol);
      const currentPrice = profile?.financialData?.currentPrice || h.averageCost;
      const prevPrice = profile?.financialData?.currentPrice ? currentPrice / (1 + (profile.financialData.revenue?.growth || 0.01)) : h.averageCost;
      const sector = profile?.companyInfo?.sector || 'Unknown';
      const industry = profile?.companyInfo?.industry || 'Unknown';

      const value = h.shares * currentPrice;
      const cost = h.shares * h.averageCost;
      const gl = value - cost;
      const glPercent = cost > 0 ? (gl / cost) * 100 : 0;
      
      const change = currentPrice - prevPrice;
      const changePercent = prevPrice > 0 ? (change / prevPrice) * 100 : 0;
      const dailyHoldingChange = h.shares * change;

      totalValue += value;
      costBasis += cost;
      dailyChange += dailyHoldingChange;

      // Sector Accumulation
      sectorAllocation[sector] = (sectorAllocation[sector] || 0) + value;

      holdingsDetail.push({
        _id: h._id,
        symbol: h.symbol,
        name: h.name,
        shares: h.shares,
        averageCost: h.averageCost,
        currentPrice: parseFloat(currentPrice.toFixed(2)),
        currentValue: parseFloat(value.toFixed(2)),
        gainLoss: parseFloat(gl.toFixed(2)),
        gainLossPercent: parseFloat(glPercent.toFixed(2)),
        dailyChange: parseFloat(dailyHoldingChange.toFixed(2)),
        dailyChangePercent: parseFloat(changePercent.toFixed(2)),
        sector,
        industry
      });

      // Track price histories for portfolio chart
      const history = profile?.financialData?.priceHistory || [currentPrice];
      priceHistories.push(history);
      weights.push(value);
    }

    // Normalize sector allocation to percentages
    const sectorPercentage = {};
    for (const sector in sectorAllocation) {
      sectorPercentage[sector] = parseFloat(((sectorAllocation[sector] / totalValue) * 100).toFixed(1));
    }

    // Calculate Diversification Score (Herfindahl-Hirschman Index - HHI)
    // HHI = sum of squared weights. Lower HHI = more diversified.
    let hhi = 0;
    holdingsDetail.forEach(h => {
      const weight = h.currentValue / totalValue;
      hhi += weight * weight;
    });
    // Scale HHI (which is between 1/N and 1.0) into a score between 10 and 100
    const diversificationScore = Math.max(10, Math.min(100, Math.round(100 - (hhi * 90))));

    // Blend price histories into a single portfolio performance array (12 points)
    const performanceHistory = [];
    const maxHistoryLen = Math.max(...priceHistories.map(h => h.length), 0);
    
    if (maxHistoryLen > 0 && totalValue > 0) {
      for (let i = 0; i < maxHistoryLen; i++) {
        let blendedVal = 0;
        let totalWeight = 0;
        for (let j = 0; j < priceHistories.length; j++) {
          const hist = priceHistories[j];
          const point = hist[i] !== undefined ? hist[i] : hist[hist.length - 1];
          blendedVal += point * (weights[j] / holdingsDetail[j].currentPrice);
        }
        performanceHistory.push(parseFloat(blendedVal.toFixed(2)));
      }
    }

    const gainLoss = totalValue - costBasis;
    const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;
    const prevTotalValue = totalValue - dailyChange;
    const dailyChangePercent = prevTotalValue > 0 ? (dailyChange / prevTotalValue) * 100 : 0;

    res.json({
      holdings: holdingsDetail,
      totalValue: parseFloat(totalValue.toFixed(2)),
      costBasis: parseFloat(costBasis.toFixed(2)),
      gainLoss: parseFloat(gainLoss.toFixed(2)),
      gainLossPercent: parseFloat(gainLossPercent.toFixed(2)),
      dailyChange: parseFloat(dailyChange.toFixed(2)),
      dailyChangePercent: parseFloat(dailyChangePercent.toFixed(2)),
      sectorAllocation: sectorPercentage,
      diversificationScore,
      performanceHistory
    });
  } catch (error) {
    console.error('getPortfolio error:', error.message);
    res.status(500).json({ message: 'Failed to retrieve portfolio data' });
  }
};

const addHolding = async (req, res) => {
  try {
    const { symbol, shares, averageCost } = req.body;
    if (!symbol || !shares || !averageCost) {
      return res.status(400).json({ message: 'Symbol, shares, and average cost are required' });
    }

    const upperSymbol = symbol.toUpperCase();
    const profile = await yahooFinance.getCompanyProfile(upperSymbol);
    if (!profile) {
      return res.status(404).json({ message: 'Stock ticker not found' });
    }

    let portfolio = await Portfolio.findOne({ user: req.userId });
    if (!portfolio) {
      portfolio = new Portfolio({ user: req.userId, holdings: [] });
    }

    // Check if symbol already exists, if so accumulate or override
    const existingIndex = portfolio.holdings.findIndex(h => h.symbol === upperSymbol);
    if (existingIndex > -1) {
      const existing = portfolio.holdings[existingIndex];
      const newShares = existing.shares + parseFloat(shares);
      const newCost = ((existing.shares * existing.averageCost) + (parseFloat(shares) * parseFloat(averageCost))) / newShares;
      portfolio.holdings[existingIndex].shares = newShares;
      portfolio.holdings[existingIndex].averageCost = parseFloat(newCost.toFixed(4));
    } else {
      portfolio.holdings.push({
        symbol: upperSymbol,
        name: profile.companyInfo.name,
        shares: parseFloat(shares),
        averageCost: parseFloat(averageCost)
      });
    }

    await portfolio.save();
    res.status(201).json(portfolio);
  } catch (error) {
    console.error('addHolding error:', error.message);
    res.status(500).json({ message: 'Failed to add holding' });
  }
};

const updateHolding = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { shares, averageCost } = req.body;

    if (!shares || !averageCost) {
      return res.status(400).json({ message: 'Shares and average cost are required' });
    }

    const portfolio = await Portfolio.findOne({ user: req.userId });
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    const existingIndex = portfolio.holdings.findIndex(h => h.symbol === symbol.toUpperCase());
    if (existingIndex === -1) {
      return res.status(404).json({ message: 'Holding not found' });
    }

    portfolio.holdings[existingIndex].shares = parseFloat(shares);
    portfolio.holdings[existingIndex].averageCost = parseFloat(averageCost);

    await portfolio.save();
    res.json(portfolio);
  } catch (error) {
    console.error('updateHolding error:', error.message);
    res.status(500).json({ message: 'Failed to update holding' });
  }
};

const deleteHolding = async (req, res) => {
  try {
    const { symbol } = req.params;
    const portfolio = await Portfolio.findOne({ user: req.userId });
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    portfolio.holdings = portfolio.holdings.filter(h => h.symbol !== symbol.toUpperCase());
    await portfolio.save();
    res.json(portfolio);
  } catch (error) {
    console.error('deleteHolding error:', error.message);
    res.status(500).json({ message: 'Failed to delete holding' });
  }
};

module.exports = { getPortfolio, addHolding, updateHolding, deleteHolding };
