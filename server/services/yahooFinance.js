const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
const offlineData = require('./offlineData');

const searchCompany = async (query) => {
  try {
    const result = await yahooFinance.search(query);
    const quotes = result.quotes || [];
    return quotes
      .filter(q => q.quoteType === 'EQUITY')
      .map(q => ({
        symbol: q.symbol,
        name: q.shortname || q.longname,
        exchange: q.exchange,
        type: q.quoteType
      }));
  } catch (error) {
    console.error('YF search error:', error.message);
    // If search fails due to network, search our local predefined list
    const qUpper = query.toUpperCase();
    const results = [];
    for (const sym of offlineData.predefinedList) {
      const profile = offlineData.getPrecompiledCompanyProfile(sym);
      if (sym.includes(qUpper) || profile.companyName.toUpperCase().includes(qUpper)) {
        results.push({
          symbol: sym,
          name: profile.companyName,
          exchange: 'NASDAQ',
          type: 'EQUITY'
        });
      }
    }
    return results;
  }
};

const getCompanyProfile = async (symbol) => {
  try {
    const upperSymbol = symbol.toUpperCase();
    
    // Fetch both quote and quoteSummary
    const quote = await yahooFinance.quote(upperSymbol).catch(() => ({}));
    const summary = await yahooFinance.quoteSummary(upperSymbol, {
      modules: [
        'summaryProfile',
        'financialData',
        'defaultKeyStatistics',
        'incomeStatementHistory',
        'cashflowStatementHistory',
        'balanceSheetHistory',
        'summaryDetail'
      ]
    }).catch(() => ({}));

    // If both are empty, fall back to offline high-fidelity data
    if (!quote.symbol && !summary.summaryProfile) {
      console.warn('Live Yahoo Finance API failed. Using high-fidelity offline fallback data for:', upperSymbol);
      return offlineData.getPrecompiledCompanyProfile(upperSymbol);
    }

    const profile = summary.summaryProfile || {};
    const financialData = summary.financialData || {};
    const defaultKeyStats = summary.defaultKeyStatistics || {};
    const summaryDetail = summary.summaryDetail || {};
    const incomeStatement = summary.incomeStatementHistory?.incomeStatementHistory || [];

    // Get company name and industry
    const companyName = quote.longName || quote.shortName || quote.displayName || summaryDetail.longName || upperSymbol;
    const industry = profile.industry || null;
    const sector = profile.sector || null;

    // Get revenue and net income from income statement
    const revenueCurrent = incomeStatement[0]?.totalRevenue || financialData.totalRevenue || null;
    const revenuePrevious = incomeStatement[1]?.totalRevenue || null;
    const netIncomeCurrent = incomeStatement[0]?.netIncome || null;
    const netIncomePrevious = incomeStatement[1]?.netIncome || null;

    // Calculate revenue growth
    let revenueGrowth = financialData.revenueGrowth || null;
    if (!revenueGrowth && revenueCurrent && revenuePrevious && revenuePrevious !== 0) {
      revenueGrowth = (revenueCurrent - revenuePrevious) / revenuePrevious;
    }

    // Calculate net income growth
    let netIncomeGrowth = financialData.earningsGrowth || null;
    if (!netIncomeGrowth && netIncomeCurrent && netIncomePrevious && netIncomePrevious !== 0) {
      netIncomeGrowth = (netIncomeCurrent - netIncomePrevious) / netIncomePrevious;
    }

    // Get historical revenue and profit data (max 5)
    // Reverse it so it's in chronological order: [FY-3, FY-2, FY-1, Current]
    const revenueHistory = incomeStatement.slice(0, 5).map(stmt => stmt.totalRevenue).filter(v => v !== null && v !== undefined).reverse();
    const profitHistory = incomeStatement.slice(0, 5).map(stmt => stmt.netIncome).filter(v => v !== null && v !== undefined).reverse();

    // Get cash flow
    const cashFlow = financialData.operatingCashflow || financialData.freeCashflow || null;

    // Get total debt
    const debt = financialData.totalDebt || null;

    // Get operating margin
    const operatingMargin = financialData.operatingMargins || null;

    // Get ROE and ROA
    const roe = financialData.returnOnEquity || null;
    const roa = financialData.returnOnAssets || null;

    // Get dividend yield and rate
    const dividendYield = quote.dividendYield || summaryDetail.dividendYield || financialData.dividendYield || null;
    const dividendRate = quote.dividendRate || summaryDetail.dividendRate || financialData.dividendRate || null;

    // Get P/E ratio
    const peRatio = quote.trailingPE || summaryDetail.trailingPE || defaultKeyStats.trailingPE || null;

    // Get EPS
    const eps = quote.epsTrailingTwelveMonths || defaultKeyStats.trailingEps || null;

    // Get market cap
    const marketCap = quote.marketCap || summaryDetail.marketCap || financialData.marketCap || null;

    // Get cash
    const cash = financialData.totalCash || null;

    // Get shares outstanding
    const sharesOutstanding = quote.sharesOutstanding || defaultKeyStats.sharesOutstanding || null;

    // Get exchange
    const exchange = quote.exchange || null;

    // Calculate interest coverage
    let interestCoverage = null;
    if (financialData.totalDebt > 0 && financialData.ebitda) {
      interestCoverage = parseFloat((financialData.ebitda / (financialData.totalDebt * 0.05)).toFixed(2));
    } else if (financialData.ebitda) {
      interestCoverage = 25.0;
    }

    return {
      companyInfo: {
        logo: '',
        name: companyName,
        industry: industry,
        sector: sector,
        ceo: profile.ceo || (profile.companyOfficers?.[0]?.name) || null,
        website: profile.website || null,
        employees: profile.fullTimeEmployees || null,
        founded: profile.founded || null,
        headquarters: profile.city ? `${profile.city}, ${profile.country || ''}`.trim() : null,
        description: profile.longBusinessSummary || null,
        country: profile.country || null,
        exchange: exchange
      },
      financialData: {
        revenue: { 
          current: revenueCurrent, 
          previous: revenuePrevious, 
          growth: revenueGrowth 
        },
        netIncome: { 
          current: netIncomeCurrent, 
          previous: netIncomePrevious, 
          growth: netIncomeGrowth 
        },
        marketCap: marketCap,
        currentPrice: quote.regularMarketPrice || financialData.currentPrice || null,
        peRatio: peRatio,
        eps: eps,
        dividend: { 
          yield: dividendYield, 
          rate: dividendRate
        },
        debt: debt,
        cashFlow: cashFlow,
        operatingMargin: operatingMargin,
        roe: roe,
        roa: roa,
        fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || summaryDetail.fiftyTwoWeekHigh || null,
        fiftyTwoWeekLow: quote.fiftyTwoWeekLow || summaryDetail.fiftyTwoWeekLow || null,
        cash: cash,
        sharesOutstanding: sharesOutstanding,
        ratios: {
          debtToEquity: financialData.debtToEquity || null,
          currentRatio: financialData.currentRatio || null,
          quickRatio: financialData.quickRatio || null,
          interestCoverage: interestCoverage,
          priceToBook: defaultKeyStats.priceToBook || null,
          pegRatio: defaultKeyStats.pegRatio || null,
          evToEbitda: defaultKeyStats.enterpriseToEbitda || null,
          evToSales: defaultKeyStats.enterpriseToRevenue || null
        },
        revenueHistory: revenueHistory,
        profitHistory: profitHistory,
        priceHistory: [] // Will be populated by caller
      }
    };
  } catch (error) {
    console.error('getCompanyProfile error:', error.message);
    return null;
  }
};

const getHistoricalPrices = async (symbol) => {
  try {
    const period1 = new Date();
    period1.setFullYear(period1.getFullYear() - 1);
    const period2 = new Date();
    
    const result = await yahooFinance.chart(symbol.toUpperCase(), {
      period1,
      period2,
      interval: '1mo'
    });
    return result.quotes.map(q => q.close).filter(v => v != null);
  } catch (error) {
    console.warn('getHistoricalPrices error, using offline fallback:', error.message);
    const fallback = offlineData.getPrecompiledCompanyProfile(symbol);
    return fallback?.financialData?.priceHistory || [];
  }
};

const getDailyPrices = async (symbol) => {
  try {
    const period1 = new Date();
    period1.setMonth(period1.getMonth() - 6); // 6 months ago
    const period2 = new Date();
    
    const result = await yahooFinance.chart(symbol.toUpperCase(), {
      period1,
      period2,
      interval: '1d'
    });
    return result.quotes.map(q => q.close).filter(v => v != null);
  } catch (error) {
    console.warn('getDailyPrices error, using offline fallback:', error.message);
    const fallback = offlineData.getPrecompiledCompanyProfile(symbol);
    return fallback?.financialData?.priceHistory || [];
  }
};

const validateCompany = async (query) => {
  try {
    const result = await yahooFinance.search(query);
    const quotes = result.quotes || [];
    const equity = quotes.find(q => q.quoteType === 'EQUITY');
    return equity ? { symbol: equity.symbol, name: equity.shortname || equity.longname } : null;
  } catch {
    const qUpper = query.toUpperCase();
    const match = offlineData.predefinedList.find(sym => sym === qUpper);
    if (match) {
      const p = offlineData.getPrecompiledCompanyProfile(match);
      return { symbol: match, name: p.companyName };
    }
    const p = offlineData.getPrecompiledCompanyProfile(qUpper);
    if (p) {
      return { symbol: qUpper, name: p.companyName };
    }
    return null;
  }
};

module.exports = { searchCompany, getCompanyProfile, getHistoricalPrices, getDailyPrices, validateCompany };