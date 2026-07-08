# InvestMind AI - AI Investment Research Agent
### InsideIIM × Altuni AI Labs — Take-Home Assignment Submission

InvestMind AI is a full-stack investment research platform built to analyze publicly traded companies, compile multi-source data, and determine whether to **INVEST**, **HOLD**, or **PASS** with clear, data-driven reasoning.

---

## 1. Overview — What It Does
InvestMind AI is a professional financial intelligence dashboard. It automates institutional-grade equity research by orchestrating multiple APIs through an intelligent agent.

- **AI-Powered Recommendation Agent**: Processes financial statements, recent news headlines, and web research to output a recommendation (`INVEST`, `HOLD`, or `PASS`) along with Confidence and Investment scores.
- **Interactive DCF Valuation Sandbox**: A premium real-time valuation simulator. It pulls actual company revenue, operating margins, cash, debt, and shares outstanding, allowing users to tweak Growth Rates, Operating Margins, and WACC via sliders to calculate the intrinsic value per share instantly.
- **Financial Chart Visualizers**: Renders 5-year chronological charts for Revenue, Net Income, Stock Prices, and News Sentiment distributions.
- **AI-Powered SWOT & Risk Analysis**: Summarizes strengths, weaknesses, opportunities, and threats.
- **Interactive AI Chat Room**: A secure workspace where users can ask custom questions about the research report.
- **PDF Research Report Exporter**: Downloads full reports locally.

---

## 2. How to Run It — Setup and Steps

### Prerequisites
- Node.js (v18+)
- npm or yarn
- MongoDB Atlas account (or local MongoDB)

### Environment Setup (`.env` File)
Create a `.env` file in the project root directory with the following variables:

```bash
# Server
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/stocksai?retryWrites=true&w=majority

# JWT Authentication
JWT_SECRET=8c5d8f2a1e9b4c7d3f6a0e5b2c8d1f4a7e3b0c9d2f5a8e1b4c7d0f3a6e9b2c

# AI & Search APIs
GEMINI_API_KEY=your_gemini_api_key
TAVILY_API_KEY=your_tavily_api_key
NEWS_API_KEY=your_newsapi_key

# Client Config
CLIENT_URL=http://localhost:3000
```

### Steps to Run

1. **Install Backend Dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd ../client
   npm install
   ```

3. **Start the Express Backend**
   ```bash
   cd ../server
   npm run dev
   ```
   *The server starts on port `5000`.*

4. **Start the React Frontend**
   ```bash
   cd ../client
   npm start
   ```
   *The client starts on port `3000`.*

5. **Open Browser**
   - Navigate to `http://localhost:3000`
   - Register a new account and begin searching ticker symbols (e.g., `AAPL`, `MSFT`, `INFY`).

---

## 3. How It Works — Approach and Architecture

### Architecture Flow
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   React     │◄───▶│   Express    │◄───▶│   MongoDB   │
│   Frontend  │     │   Backend    │     │   Database  │
└─────────────┘     └──────┬───────┘     └─────────────┘
                           │
                    ┌──────▼───────┐
                    │  LangChain   │
                    │    Agent     │
                    └──────┬───────┘
                           │
             ┌─────────────┼─────────────┐
       ┌─────▼────┐  ┌────▼────┐   ┌─────▼────┐
       │  Yahoo   │  │  News   │   │  Tavily  │
       │ Finance  │  │   API   │   │  Search  │
       └──────────┘  └─────────┘   └──────────┘
```

### Agent Operations Workflow
1. **User Ticker Submission**: The user submits a stock ticker (e.g., `AAPL`).
2. **Multi-Source Fetching**:
   - **Yahoo Finance**: Fetches company statistics (P/E ratio, EPS, cash, debt, current price, shares outstanding) and 5-year income statements.
   - **NewsAPI**: Pulls recent articles and calculates sentiment scores.
   - **Tavily Search**: Performs advanced web research for corporate news and filings.
3. **LangChain/LLM Processing**: The agent compiles these data points into a prompt. If the API key is valid, Google Gemini generates a structured SWOT, risk distribution, and investment reasoning.
4. **Data-Driven Rules Engine Fallback**: If the Gemini API key is rate-limited or invalid, a robust, mathematical rules engine calculates the stock's position in its 52-week range, analyzes historical trends, and issues a technical BUY/HOLD/PASS recommendation to ensure the application never crashes.
5. **MongoDB Cache**: Caches reports for 24 hours to reduce API usage and guarantee ultra-fast responses.

---

## 4. Key Decisions & Trade-Offs

- **Key Decision (yahoo-finance2 Integration)**: Standard Axios calls to Yahoo Finance endpoints frequently trigger `401 Unauthorized` blocks. We upgraded to `yahoo-finance2` package which handles cookies/crumbs internally, ensuring reliable data delivery.
- **Key Decision (Dual-Engine Recommendation)**: LLMs are prone to rate limits or invalid API keys. To ensure a resilient UX, the backend implements a secondary data-driven rules engine. If the AI service fails, the platform falls back to calculating technical indicators (price change, 52W range midpoint position, momentum) and displays a valid, logical investment recommendation.
- **Trade-Off (DCF Valuation Assumptions)**: For the Valuation Sandbox, FCF is estimated using NOPAT (Net Operating Profit After Tax), assuming Capex and D&A offset. While sophisticated models include working capital and cap-ex adjustments, this proxy provides an elegant, interactive interface without cluttering the UI or requiring heavy inputs.
- **Trade-Off (JWT Caching)**: Caching is set to 24 hours to protect API quota limits.

---

## 5. Example Runs

### Example 1: Apple Inc. (`AAPL`)
- **Current Price**: `$310.66`
- **52W High / Low**: `$317.40 / $201.50` (Price at 94% of range)
- **Market Cap**: `$4.56T`
- **P/E Ratio**: `37.66`
- **Recommendation**: **INVEST**
- **Reasoning**: Apple Inc. trades at 94% of its 52-week range with a strong bullish trend (+33.8%) and positive news sentiment. A high investment score of `82/100` reflects established market presence, offset slightly by an elevated P/E ratio.

### Example 2: Infosys Limited (`INFY`)
- **Current Price**: `$10.88`
- **52W High / Low**: `$30.00 / $10.34` (Price at 2% of range)
- **Recommendation**: **PASS** (or **HOLD** depending on current sentiment)
- **Reasoning**: Trading near its 52-week low indicates negative momentum and investor apprehension. While operations are stable, the technical indicators suggest passing until a reversal is confirmed.

---

## 6. Next Steps & Future Improvements
- **WebSocket Updates**: Real-time ticker streaming on the Dashboard.
- **WACC Calculator**: Let users input cost of equity, debt, and beta to calculate a custom Discount Rate.
- **Competitor Comparison**: Compare multiples side-by-side with peer averages.

---

## 7. BONUS: LLM Chat Logs & Session Transcript
As mandated in the assignment, this project was developed in partnership with our LLM developer assistant. The complete step-by-step logs and chat transcripts detailing the architectural decisions, debugging sessions, and code revisions are saved in the project root:

- **File name**: `llm_chat_session_logs.jsonl`
- **Location**: `/llm_chat_session_logs.jsonl`
