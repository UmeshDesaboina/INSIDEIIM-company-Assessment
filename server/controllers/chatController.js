const Report = require('../models/Report');
const { generateContent } = require('../services/geminiService');

const chat = async (req, res) => {
  try {
    let { symbol, message } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    let upperSymbol = symbol ? symbol.toUpperCase() : undefined;
    
    // Auto-detect symbol from message if not provided
    if (!upperSymbol && message) {
      const match = message.match(/\b([A-Z]{2,5})\b/);
      if (match) {
        upperSymbol = match[1];
      }
    }

    let report = null;

    if (upperSymbol) {
      // Find the user's report for this symbol
      report = await Report.findOne({
        user: req.userId,
        symbol: upperSymbol
      }).sort({ createdAt: -1 });

      if (!report) {
        // Fall back to a cached report from other users
        const cached = await Report.findOne({
          symbol: upperSymbol,
          cachedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }).sort({ cachedAt: -1 });

        if (cached) {
          report = await Report.create({
            user: req.userId,
            symbol: cached.symbol,
            companyName: cached.companyName,
            companyInfo: cached.companyInfo,
            financialData: cached.financialData,
            aiAnalysis: cached.aiAnalysis,
            recommendation: cached.recommendation,
            news: cached.news,
            newsSentiment: cached.newsSentiment
          });
        }
      }
    }

    // If still no report found, fall back to the user's most recent report of any symbol
    if (!report) {
      report = await Report.findOne({ user: req.userId }).sort({ createdAt: -1 });
    }

    if (!report) {
      return res.status(404).json({ message: 'No report found. Please search for a company first.' });
    }

    const context = {
      companyName: report.companyName,
      symbol: report.symbol,
      financialData: report.financialData,
      aiAnalysis: report.aiAnalysis,
      recommendation: report.recommendation,
      news: report.news?.slice(0, 3)
    };

    const prompt = `You are an AI investment assistant. You have access to the following research report context:

Company: ${context.companyName} (${context.symbol})
Recommendation: ${context.recommendation?.type}
Confidence Score: ${context.recommendation?.confidenceScore}/100
Investment Score: ${context.recommendation?.investmentScore}/100

Key Financials:
- Revenue: ${context.financialData?.revenue?.current ? '$' + (context.financialData.revenue.current / 1e9).toFixed(2) + 'B' : 'N/A'}
- Net Income: ${context.financialData?.netIncome?.current ? '$' + (context.financialData.netIncome.current / 1e9).toFixed(2) + 'B' : 'N/A'}
- Market Cap: ${context.financialData?.marketCap ? '$' + (context.financialData.marketCap / 1e9).toFixed(2) + 'B' : 'N/A'}
- P/E Ratio: ${context.financialData?.peRatio?.toFixed(2) || 'N/A'}
- EPS: ${context.financialData?.eps ? '$' + context.financialData.eps.toFixed(2) : 'N/A'}

Executive Summary: ${context.aiAnalysis?.executiveSummary || 'N/A'}

User Question: ${message}

Rules:
1. Answer ONLY based on the provided context.
2. If the information is not in the context, say "I don't have enough information to answer that based on the current report."
3. Be concise and helpful.
4. Do not make up data or projections.`;

    let answer;
    try {
      answer = await generateContent(prompt);
    } catch (e) {
      console.warn('Gemini chat helper failed, using local rule-based assistant fallback:', e.message);
      
      const msg = message.toLowerCase();
      
      const company = context.companyName;
      const ticker = context.symbol;
      const recType = context.recommendation?.type || 'HOLD';
      const score = context.recommendation?.investmentScore || 'N/A';
      const confidence = context.recommendation?.confidenceScore || 'N/A';
      const price = context.financialData?.currentPrice ? `$${context.financialData.currentPrice.toFixed(2)}` : 'N/A';
      const pe = context.financialData?.peRatio ? context.financialData.peRatio.toFixed(2) : 'N/A';
      const cap = context.financialData?.marketCap ? `$${(context.financialData.marketCap / 1e9).toFixed(2)}B` : 'N/A';

      if (msg.includes('should i buy') || msg.includes('buy today') || msg.includes('invest') || msg.includes('should i invest')) {
        answer = `### Investment Recommendation for **${company} (${ticker})**
Our AI analysis recommends **${recType}** for this stock. 
* **Investment Score:** ${score}/100
* **Confidence Level:** ${confidence}%
* **Current Price:** ${price}

**Key Rationale:**
${context.recommendation?.reasoning || 'Stable financial operations support this stance.'}

**Key Strengths:**
${context.recommendation?.strengths?.map(s => `* ${s}`).join('\n') || '* Solid cash generation\n* Established market leadership'}

**Key Risks:**
${context.recommendation?.risks?.map(r => `* ${r}`).join('\n') || '* Competitive tech landscape\n* Regulatory compliance challenges'}`;
      } 
      else if (msg.includes('valuation') || msg.includes('dcf') || msg.includes('fair value') || msg.includes('intrinsic')) {
        answer = `### Valuation Analysis for **${company} (${ticker})**
* **Current Trading Price:** ${price}
* **Trailing P/E Ratio:** ${pe}
* **Market Capitalization:** ${cap}

The platform incorporates an **Interactive DCF Sandbox** to model the intrinsic fair value of ${ticker} based on customizable assumptions (Revenue Growth, Target Margin, WACC). 
* To run your own scenarios, navigate to the **Valuation** tab on this report page and adjust WACC and Growth rate sliders.
* This allows you to inspect potential upside/downside under custom economic scenarios. The valuation details are modeled for educational purposes and should not be treated as professional financial advice.`;
      }
      else if (msg.includes('compare') || msg.includes('vs') || msg.includes('competitor') || msg.includes('microsoft') || msg.includes('apple') || msg.includes('google')) {
        answer = `### Peer Comparison: **${ticker}** vs Competitors
To compare ${ticker} side-by-side with industry peers:
1. Navigate to the **Compare** page from the sidebar menu.
2. Select or search for peers (e.g. **AAPL**, **MSFT**, **GOOGL**, **META**, **TSLA**, **NVDA**, **AMD**, **NFLX**).
3. Click the Compare button.

This displays a side-by-side comparative grid of **Market Caps, P/E ratios, EPS, operating margins, ROE**, and technical signals, as well as revenue charts to identify relative valuation opportunities.`;
      }
      else if (msg.includes('pe ratio') || msg.includes('p/e') || msg.includes('valuation multiples') || msg.includes('price to earnings')) {
        answer = `### Financial Education: P/E Ratio
The **Price-to-Earnings (P/E) Ratio** is a standard valuation multiple calculated by dividing the stock's current price by its Earnings Per Share (EPS).
* **${ticker} Current P/E:** ${pe}
* **Earnings Per Share (EPS):** $${context.financialData?.eps ? context.financialData.eps.toFixed(2) : 'N/A'}

**Interpretation:**
A P/E of ${pe} means investors are currently willing to pay $${pe} for every $1 of trailing annual earnings. High P/E ratios (>30) often reflect strong growth expectations (e.g. cloud, AI pipelines), whereas lower P/E ratios (<15) may indicate undervaluation or slower expansion.`;
      }
      else if (msg.includes('roe') || msg.includes('return on equity') || msg.includes('profitability metrics')) {
        const roeVal = context.financialData?.roe ? (context.financialData.roe * 100).toFixed(2) + '%' : 'N/A';
        answer = `### Financial Education: Return on Equity (ROE)
**Return on Equity (ROE)** measures a company's profitability relative to shareholders' equity. It indicates how efficiently management is using shareholder capital to generate earnings.
* **${ticker} ROE:** ${roeVal}

An ROE of ${roeVal} represents high operational efficiency in compounding book value. A higher ROE (typically >15%) indicates that the firm possesses strong competitive advantages (economic moats) and capital allocation efficiency.`;
      }
      else if (msg.includes('earnings') || msg.includes('revenue') || msg.includes('profit') || msg.includes('growth')) {
        const revGrowth = context.financialData?.revenue?.growth ? (context.financialData.revenue.growth * 100).toFixed(2) + '%' : 'N/A';
        const netGrowth = context.financialData?.netIncome?.growth ? (context.financialData.netIncome.growth * 100).toFixed(2) + '%' : 'N/A';
        answer = `### Earnings & Growth Summary for **${company} (${ticker})**
* **Year-over-Year Revenue Growth:** ${revGrowth}
* **Year-over-Year Net Income Growth:** ${netGrowth}
* **Operating Margin:** ${context.financialData?.operatingMargin ? (context.financialData.operatingMargin * 100).toFixed(2) + '%' : 'N/A'}

**Recent Trends:**
${context.aiAnalysis?.growthAnalysis || 'Operations show stable growth trends with solid profit conversion.'}`;
      }
      else {
        answer = `### AI Assistant Response for **${ticker}**
Thank you for your question regarding **${company} (${ticker})**. 

* **Current Status:** The stock is recommended as a **${recType}** with a confidence of **${confidence}%** and an investment score of **${score}/100**.
* **Current Price:** ${price}
* **P/E Ratio:** ${pe}

**Executive Summary:**
${context.aiAnalysis?.executiveSummary || 'No summary available.'}

*If you would like to test other questions, try asking about **valuation (DCF)**, **P/E ratio**, **ROE**, **growth metrics**, or **investment recommendations**!*`;
      }
    }

    res.json({ answer });
  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(500).json({ message: 'Failed to get AI response' });
  }
};

module.exports = { chat };
