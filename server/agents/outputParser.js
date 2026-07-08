const outputParser = {
  parse: (text) => {
    try {
      let cleaned = text.trim();
      cleaned = cleaned.replace(/```json?/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (e) {
      throw new Error('Failed to parse AI output as JSON');
    }
  },

  ANALYSIS_SCHEMA: `{
  "aiAnalysis": {
    "executiveSummary": "string - 2-3 sentence summary",
    "businessAnalysis": "string - detailed business model analysis",
    "growthAnalysis": "string - growth prospects analysis",
    "competitiveAnalysis": "string - competitive position analysis",
    "swot": {
      "strengths": ["string array - key strengths"],
      "weaknesses": ["string array - key weaknesses"],
      "opportunities": ["string array - key opportunities"],
      "threats": ["string array - key threats"]
    },
    "riskAnalysis": "string - risk assessment",
    "futureOutlook": "string - future outlook",
    "marketPosition": "string - market position analysis"
  },
  "recommendation": {
    "type": "INVEST or HOLD or PASS",
    "confidenceScore": "number 0-100",
    "investmentScore": "number 0-100",
    "scoreBreakdown": {
      "fundamentals": "number 0-100",
      "technical": "number 0-100",
      "valuation": "number 0-100",
      "profitability": "number 0-100",
      "growth": "number 0-100",
      "sentiment": "number 0-100",
      "risk": "number 0-100"
    },
    "reasoning": "string - detailed reasoning for recommendation",
    "strengths": ["string array"],
    "weaknesses": ["string array"],
    "risks": ["string array"]
  },
  "newsSentiment": {
    "positive": "number - count of positive news",
    "negative": "number - count of negative news",
    "neutral": "number - count of neutral news",
    "overall": "positive or negative or neutral"
  }
}`,

  NEWS_SCHEMA: `{
  "sentiment": "positive, negative, or neutral",
  "reasoning": "string - one sentence reasoning"
}`
};

module.exports = outputParser;
