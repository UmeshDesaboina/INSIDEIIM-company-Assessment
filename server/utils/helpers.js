const PDFDocument = require('pdfkit');

const COLORS = {
  primary: [45, 55, 72],
  accent: [99, 102, 241],
  success: [16, 185, 129],
  warning: [245, 158, 11],
  danger: [239, 68, 68],
  muted: [156, 163, 175],
  light: [243, 244, 246],
  white: [255, 255, 255],
  dark: [30, 35, 45]
};

const drawProgressBar = (doc, x, y, width, height, percent, color) => {
  doc.roundedRect(x, y, width, height, 3).fill(...COLORS.light);
  if (percent > 0) {
    doc.roundedRect(x, y, width * (percent / 100), height, 3).fill(...color);
  }
};

const formatCurrency = (value) => {
  if (value == null || isNaN(value)) return 'N/A';
  const absVal = Math.abs(value);
  if (absVal >= 1e12) return '$' + (absVal / 1e12).toFixed(2) + 'T';
  if (absVal >= 1e9) return '$' + (absVal / 1e9).toFixed(2) + 'B';
  if (absVal >= 1e6) return '$' + (absVal / 1e6).toFixed(2) + 'M';
  return '$' + absVal.toFixed(2);
};

const formatPercent = (value) => {
  if (value == null || isNaN(value)) return 'N/A';
  return (value * 100).toFixed(1) + '%';
};

const formatChartCurrency = (value) => {
  if (value == null || isNaN(value)) return '';
  const absVal = Math.abs(value);
  if (absVal >= 1e12) return '$' + (absVal / 1e12).toFixed(1) + 'T';
  if (absVal >= 1e9) return '$' + (absVal / 1e9).toFixed(1) + 'B';
  if (absVal >= 1e6) return '$' + (absVal / 1e6).toFixed(0) + 'M';
  return '$' + absVal.toFixed(0);
};

const formatChartPercent = (value) => {
  if (value == null || isNaN(value)) return '';
  return (value * 100).toFixed(1) + '%';
};

const computeScore = (key, fd, rec, tech) => {
  const val = rec.scoreBreakdown?.[key];
  if (val != null && !isNaN(val)) return Math.min(100, Math.max(0, val));
  switch (key) {
    case 'fundamentals':
      return Math.round((fd.roe != null ? Math.min(45, fd.roe * 30) : 0) + (fd.ratios?.debtToEquity != null && fd.ratios.debtToEquity < 1.5 ? 30 : 10) + (fd.ratios?.currentRatio != null && fd.ratios.currentRatio > 1.5 ? 25 : 10));
    case 'technical':
      return tech?.rsi ? Math.round(Math.min(98, Math.max(10, tech.rsi))) : 55;
    case 'valuation':
      if (fd.peRatio != null && fd.peRatio > 0) {
        if (fd.peRatio < 15) return 88;
        if (fd.peRatio < 25) return 78;
        if (fd.peRatio < 40) return 60;
        return Math.max(15, 60 - (fd.peRatio - 40) / 2);
      }
      return 65;
    case 'profitability':
      return Math.round(Math.min(98, Math.max(10, (fd.roe != null ? fd.roe * 80 : 40) + (fd.revenue?.growth != null ? fd.revenue.growth * 50 : 10) + 10)));
    case 'growth':
      return Math.round(Math.min(98, Math.max(10, 50 + ((fd.revenue?.growth ?? 0) * 100) + ((fd.netIncome?.growth ?? 0) * 50))));
    case 'sentiment':
      return rec.confidenceScore ?? 65;
    case 'risk':
      const d2e = fd.ratios?.debtToEquity ?? 0.5;
      const vol = 0.3;
      return Math.round(Math.min(98, Math.max(10, 85 - (vol * 60) - (d2e > 2 ? 20 : d2e * 8))));
    default:
      return rec.investmentScore ?? 75;
  }
};

const getScoreColor = (score) => {
  if (score >= 70) return COLORS.success;
  if (score >= 40) return COLORS.warning;
  return COLORS.danger;
};

const generateYearLabels = (n) => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: n }, (_, i) => `FY${currentYear - (n - 1 - i)}`);
};

const drawBarChart = (doc, x, y, w, h, data, labels, title, color) => {
  if (!data || data.length === 0) return y;

  doc.fillColor(...COLORS.dark).fontSize(10).font('Helvetica-Bold').text(title, x, y);
  y += 18;

  const chartH = h - 30;
  const chartW = w - 50;
  const lx = x + 50;
  const ly = y + chartH;

  const maxVal = Math.max(...data.map(v => Math.abs(v))) * 1.2;
  if (maxVal === 0) return y + h;

  const numYTicks = 4;
  for (let i = 0; i <= numYTicks; i++) {
    const val = (maxVal / numYTicks) * i;
    const yPos = ly - (i / numYTicks) * chartH;
    doc.fillColor(...COLORS.muted).fontSize(6).font('Helvetica').text(formatChartCurrency(val), x, yPos - 3, { width: 48, align: 'right' });
    if (i > 0) {
      doc.moveTo(lx, yPos).lineTo(lx + chartW, yPos).strokeColor(...[230, 232, 236]).stroke();
    }
  }

  doc.moveTo(lx, y).lineTo(lx, ly).strokeColor(...COLORS.muted).stroke();
  doc.moveTo(lx, ly).lineTo(lx + chartW, ly).strokeColor(...COLORS.muted).stroke();

  const barW = Math.min(18, (chartW / data.length) * 0.55);
  const gap = (chartW - barW * data.length) / (data.length + 1);
  for (let i = 0; i < data.length; i++) {
    const bx = lx + gap + i * (barW + gap);
    const bh = (Math.abs(data[i]) / maxVal) * chartH;
    const by = data[i] >= 0 ? ly - bh : ly;
    doc.roundedRect(bx, by, barW, bh, 1.5).fill(...color);
    doc.fillColor(...COLORS.dark).fontSize(5.5).font('Helvetica');
    const lbl = labels[i] || '';
    doc.text(lbl, bx - 4, ly + 3, { width: barW + 8, align: 'center' });
  }

  return y + h + 10;
};

const drawLineChart = (doc, x, y, w, h, series, labels, title) => {
  if (!series || series.length === 0 || !series[0].data || series[0].data.length === 0) return y;

  doc.fillColor(...COLORS.dark).fontSize(10).font('Helvetica-Bold').text(title, x, y);
  y += 18;

  const chartH = h - 30;
  const chartW = w - 50;
  const lx = x + 50;
  const ly = y + chartH;

  let allValues = [];
  series.forEach(s => { allValues = allValues.concat(s.data); });
  const maxVal = Math.max(...allValues.map(v => Math.abs(v))) * 1.2;
  const minVal = Math.min(0, ...allValues);
  const range = maxVal - minVal || 1;

  const numYTicks = 4;
  for (let i = 0; i <= numYTicks; i++) {
    const val = minVal + (range / numYTicks) * i;
    const yPos = ly - ((val - minVal) / range) * chartH;
    doc.fillColor(...COLORS.muted).fontSize(6).font('Helvetica').text(formatChartCurrency(val), x, yPos - 3, { width: 48, align: 'right' });
    if (i > 0) {
      doc.moveTo(lx, yPos).lineTo(lx + chartW, yPos).strokeColor(...[230, 232, 236]).stroke();
    }
  }

  doc.moveTo(lx, y).lineTo(lx, ly).strokeColor(...COLORS.muted).stroke();
  doc.moveTo(lx, ly).lineTo(lx + chartW, ly).strokeColor(...COLORS.muted).stroke();

  const n = series[0].data.length;
  const gap = n > 1 ? chartW / (n - 1) : chartW / 2;

  const colors = [COLORS.accent, COLORS.success, COLORS.warning];

  series.forEach((s, si) => {
    const color = colors[si % colors.length];
    const points = s.data.map((val, i) => ({
      x: lx + (n > 1 ? i * gap : chartW / 2),
      y: ly - ((val - minVal) / range) * chartH
    }));

    doc.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      doc.lineTo(points[i].x, points[i].y);
    }
    doc.strokeColor(...color).lineWidth(2).stroke();

    points.forEach(p => {
      doc.circle(p.x, p.y, 2.5).fill(...color);
    });
  });

  doc.lineWidth(1);

  for (let i = 0; i < n; i++) {
    const lblX = lx + (n > 1 ? i * gap : chartW / 2);
    doc.fillColor(...COLORS.dark).fontSize(5.5).font('Helvetica');
    const lbl = labels[i] || '';
    doc.text(lbl, lblX - 8, ly + 3, { width: 16, align: 'center' });
  }

  let legendX = x + 50;
  series.forEach((s, si) => {
    const color = colors[si % colors.length];
    doc.rect(legendX, y + chartH + 20, 8, 8).fill(...color);
    doc.fillColor(...COLORS.dark).fontSize(7).font('Helvetica').text(s.name, legendX + 12, y + chartH + 20);
    legendX += doc.widthOfString(s.name) + 30;
  });

  return y + h + 10;
};

const generatePDF = (report) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks = [];
      const pageWidth = doc.page.width - 100;
      const leftMargin = 50;

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      const fd = report.financialData || {};
      const rec = report.recommendation || {};
      const tech = report.technicalAnalysis || {};
      const ai = report.aiAnalysis || {};

      // ---------- COVER / HEADER ----------
      doc.rect(0, 0, doc.page.width, 140).fill(...COLORS.primary);
      doc.fill(...COLORS.white);
      doc.fontSize(28).font('Helvetica-Bold').text('Investment Research Report', leftMargin, 30, { align: 'center' });
      doc.fontSize(22).text(report.companyName || report.symbol || 'N/A', leftMargin, 70, { align: 'center' });
      doc.fontSize(12).font('Helvetica').text(report.symbol || '', leftMargin, 100, { align: 'center' });

      doc.fillColor(...COLORS.muted);
      doc.fontSize(9).text(`Generated: ${new Date().toLocaleDateString()} | Powered by AI Investment Agent`, leftMargin, 120, { align: 'center' });

      // ---------- COMPANY INFO TABLE ----------
      doc.fillColor(...COLORS.dark);
      doc.fontSize(14).font('Helvetica-Bold').text('Company Overview', leftMargin, 165);
      doc.moveTo(leftMargin, 185).lineTo(doc.page.width - leftMargin, 185).strokeColor(...COLORS.muted).stroke();
      doc.moveDown(0.5);

      const infoRows = [
        ['Symbol', report.symbol || 'N/A', 'Industry', report.companyInfo?.industry || 'N/A'],
        ['Sector', report.companyInfo?.sector || 'N/A', 'CEO', report.companyInfo?.ceo || 'N/A'],
        ['Exchange', report.companyInfo?.exchange || 'N/A', 'Employees', report.companyInfo?.employees?.toLocaleString() || 'N/A'],
        ['Headquarters', report.companyInfo?.headquarters || 'N/A', 'Founded', report.companyInfo?.founded || 'N/A']
      ];

      let yPos = 195;
      const rowH = 20;
      for (const row of infoRows) {
        doc.fontSize(9).font('Helvetica-Bold');
        doc.fillColor(...COLORS.muted).text(row[0], leftMargin, yPos, { width: 80 });
        doc.fillColor(...COLORS.dark).font('Helvetica').text(row[1], leftMargin + 80, yPos, { width: 120 });
        doc.fillColor(...COLORS.muted).font('Helvetica-Bold').text(row[2], leftMargin + 220, yPos, { width: 80 });
        doc.fillColor(...COLORS.dark).font('Helvetica').text(row[3], leftMargin + 300, yPos, { width: 150 });
        yPos += rowH;
      }

      // ---------- KEY METRICS ----------
      yPos += 20;
      doc.fillColor(...COLORS.dark);
      doc.fontSize(14).font('Helvetica-Bold').text('Financial Highlights', leftMargin, yPos);
      yPos += 20;
      doc.moveTo(leftMargin, yPos - 5).lineTo(doc.page.width - leftMargin, yPos - 5).strokeColor(...COLORS.muted).stroke();

      const metrics = [
        ['Market Cap', formatCurrency(fd.marketCap)],
        ['Current Price', fd.currentPrice ? `$${fd.currentPrice.toFixed(2)}` : 'N/A'],
        ['P/E Ratio', fd.peRatio?.toFixed(2) || 'N/A'],
        ['EPS', fd.eps ? `$${fd.eps.toFixed(2)}` : 'N/A'],
        ['Revenue (TTM)', formatCurrency(fd.revenue?.current)],
        ['Net Income', formatCurrency(fd.netIncome?.current)],
        ['Revenue Growth', formatPercent(fd.revenue?.growth)],
        ['Net Income Growth', formatPercent(fd.netIncome?.growth)]
      ];

      const metricsPerRow = 4;
      const metricW = pageWidth / metricsPerRow;
      for (let i = 0; i < metrics.length; i += metricsPerRow) {
        for (let j = 0; j < metricsPerRow && i + j < metrics.length; j++) {
          const mx = leftMargin + j * metricW;
          const [label, value] = metrics[i + j];
          const isPositive = value && !value.startsWith('-') && value !== 'N/A';
          doc.roundedRect(mx, yPos, metricW - 8, 40, 4).fill(...COLORS.light);
          doc.fillColor(...COLORS.muted).fontSize(7).font('Helvetica').text(label, mx + 8, yPos + 6, { width: metricW - 24 });
          doc.fillColor(...COLORS.dark).fontSize(11).font('Helvetica-Bold').text(value, mx + 8, yPos + 20, { width: metricW - 24 });
        }
        yPos += 48;
      }

      // ---------- AI SCORE BREAKDOWN (ALWAYS SHOWN) ----------
      yPos += 20;
      doc.fillColor(...COLORS.dark);
      doc.fontSize(14).font('Helvetica-Bold').text('AI Score Breakdown', leftMargin, yPos);
      yPos += 20;
      doc.moveTo(leftMargin, yPos - 5).lineTo(doc.page.width - leftMargin, yPos - 5).strokeColor(...COLORS.muted).stroke();

      const overallScore = rec.investmentScore || computeScore('fundamentals', fd, rec, tech);
      doc.roundedRect(leftMargin, yPos, pageWidth, 22, 4).fill(...COLORS.light);
      drawProgressBar(doc, leftMargin, yPos, pageWidth, 22, overallScore, COLORS.accent);
      doc.fillColor(...COLORS.white).fontSize(9).font('Helvetica-Bold').text(`Overall Investment Score: ${overallScore}/100`, leftMargin + 10, yPos + 5);
      yPos += 32;

      const scoreItems = [
        { label: 'Fundamentals', key: 'fundamentals', desc: 'Financial health, leverage, debt coverage' },
        { label: 'Technical Analysis', key: 'technical', desc: 'Price trend, crosses, averages' },
        { label: 'Valuation', key: 'valuation', desc: 'DCF sandbox potential, margin gaps' },
        { label: 'Profitability', key: 'profitability', desc: 'ROE, margins, yield efficiency' },
        { label: 'Growth', key: 'growth', desc: 'Revenue, earnings compound trends' },
        { label: 'News Sentiment', key: 'sentiment', desc: 'Media headlines, source indexing' },
        { label: 'Risk', key: 'risk', desc: 'Volatility, debt-to-equity ratio' }
      ];

      for (const item of scoreItems) {
        if (yPos > 700) {
          doc.addPage();
          yPos = 50;
        }
        const val = computeScore(item.key, fd, rec, tech);
        const color = getScoreColor(val);

        doc.fontSize(8).font('Helvetica');
        doc.fillColor(...COLORS.muted).text(item.label, leftMargin, yPos + 2);
        doc.fillColor(...COLORS.dark).font('Helvetica-Bold').text(`${val}/100`, leftMargin + 130, yPos + 2, { width: 40, align: 'right' });
        drawProgressBar(doc, leftMargin + 175, yPos + 4, pageWidth - 175, 12, val, color);
        doc.fillColor(...COLORS.muted).fontSize(6).font('Helvetica').text(item.desc, leftMargin + 175, yPos + 18, { width: pageWidth - 175 });
        yPos += 28;
      }

      // ---------- FINANCIAL CHARTS PAGE ----------
      const hasCharts = fd.revenueHistory && fd.revenueHistory.length > 0;
      if (hasCharts) {
        doc.addPage();
        yPos = 50;
        const labels5 = generateYearLabels(fd.revenueHistory.length);

        doc.fillColor(...COLORS.dark);
        doc.fontSize(14).font('Helvetica-Bold').text('Financial Performance Charts', leftMargin, yPos);
        yPos += 16;
        doc.moveTo(leftMargin, yPos).lineTo(doc.page.width - leftMargin, yPos).strokeColor(...COLORS.muted).stroke();
        yPos += 20;

        // Row 1: Revenue + Net Income (side by side)
        const halfW = (pageWidth - 20) / 2;
        yPos = drawBarChart(doc, leftMargin, yPos, halfW, 110, fd.revenueHistory, labels5, 'Revenue History', COLORS.accent);
        yPos = drawBarChart(doc, leftMargin + halfW + 20, yPos - 138, halfW, 110, fd.profitHistory, labels5, 'Net Income History', COLORS.success);

        yPos = Math.max(yPos, 200) + 10;

        // Row 2: Cash Flow line chart
        if (fd.operatingCashFlowHistory && fd.freeCashFlowHistory) {
          yPos = drawLineChart(doc, leftMargin, yPos, pageWidth, 130, [
            { name: 'Operating Cash Flow', data: fd.operatingCashFlowHistory },
            { name: 'Free Cash Flow', data: fd.freeCashFlowHistory }
          ], labels5, 'Cash Flow Trends');
          yPos += 15;
        }

        // Row 3: EPS + Debt
        if (fd.epsGrowthHistory && fd.debtTrendHistory) {
          yPos = drawBarChart(doc, leftMargin, yPos, halfW, 110, fd.epsGrowthHistory.map(v => v * 100), labels5, 'EPS Growth %', COLORS.accent);
          yPos = drawBarChart(doc, leftMargin + halfW + 20, yPos - 138, halfW, 110, fd.debtTrendHistory, labels5, 'Total Debt Trend', COLORS.warning);
          yPos = Math.max(yPos, 200) + 10;
        }

        // Row 4: Margins
        if (fd.operatingMarginHistory || fd.netMarginHistory) {
          const marginData = fd.operatingMarginHistory.map(v => v * 100);
          const netMarginData = fd.netMarginHistory ? fd.netMarginHistory.map(v => v * 100) : [];
          yPos = drawLineChart(doc, leftMargin, yPos, pageWidth, 130, [
            { name: 'Operating Margin', data: marginData },
            { name: 'Net Margin', data: netMarginData }
          ].filter(s => s.data.length > 0), labels5, 'Margin Trends (%)');
          yPos += 15;
        }

        // Row 5: ROE / ROA
        if (fd.roeHistory || fd.roaHistory) {
          yPos = drawLineChart(doc, leftMargin, yPos, pageWidth, 130, [
            { name: 'ROE', data: fd.roeHistory ? fd.roeHistory.map(v => v * 100) : [] },
            { name: 'ROA', data: fd.roaHistory ? fd.roaHistory.map(v => v * 100) : [] }
          ].filter(s => s.data.length > 0), labels5, 'ROE / ROA Trends (%)');
          yPos += 15;
        }
      }

      // ---------- TECHNICAL INDICATORS TABLE ----------
      const hasTech = tech && Object.keys(tech).length > 0;
      if (hasTech) {
        doc.addPage();
        yPos = 50;
        doc.fillColor(...COLORS.dark);
        doc.fontSize(14).font('Helvetica-Bold').text('Technical Indicators', leftMargin, yPos);
        yPos += 20;
        doc.moveTo(leftMargin, yPos - 5).lineTo(doc.page.width - leftMargin, yPos - 5).strokeColor(...COLORS.muted).stroke();

        const techMetrics = [
          ['RSI (14)', tech.rsi != null ? tech.rsi.toString() : 'N/A'],
          ['MACD', tech.macd || 'N/A'],
          ['Trend', tech.trend || 'N/A'],
          ['Golden Cross', tech.goldenCross || 'N/A'],
          ['Death Cross', tech.deathCross || 'N/A'],
          ['ADX', tech.adx != null ? tech.adx.toString() : 'N/A'],
          ['ATR', tech.atr ? `$${tech.atr}` : 'N/A'],
          ['VWAP', tech.vwap ? `$${tech.vwap}` : 'N/A'],
          ['Support', tech.support ? `$${tech.support}` : 'N/A'],
          ['Resistance', tech.resistance ? `$${tech.resistance}` : 'N/A']
        ];

        const techPerRow = 3;
        const techW = pageWidth / techPerRow;
        for (let i = 0; i < techMetrics.length; i += techPerRow) {
          for (let j = 0; j < techPerRow && i + j < techMetrics.length; j++) {
            const tx = leftMargin + j * techW;
            const [label, value] = techMetrics[i + j];
            doc.roundedRect(tx, yPos, techW - 6, 30, 3).fill(...COLORS.light);
            doc.fillColor(...COLORS.muted).fontSize(7).font('Helvetica').text(label, tx + 8, yPos + 3, { width: techW - 20 });
            const valColor = value === 'Bullish' ? COLORS.success : value === 'Bearish' ? COLORS.danger : COLORS.dark;
            doc.fillColor(...valColor).fontSize(9).font('Helvetica-Bold').text(value, tx + 8, yPos + 16, { width: techW - 20 });
          }
          yPos += 36;
        }

        yPos += 20;
        if (tech.rsi != null) {
          doc.fillColor(...COLORS.dark).fontSize(10).font('Helvetica-Bold').text('RSI Indicator', leftMargin, yPos);
          yPos += 16;
          doc.roundedRect(leftMargin, yPos, pageWidth, 16, 4).fill(...COLORS.light);
          drawProgressBar(doc, leftMargin, yPos, pageWidth, 16, tech.rsi, tech.rsi >= 70 ? COLORS.success : tech.rsi >= 40 ? COLORS.warning : COLORS.danger);
          doc.fillColor(...COLORS.white).fontSize(8).font('Helvetica-Bold').text(`RSI: ${tech.rsi}/100`, leftMargin + 10, yPos + 3);
          yPos += 28;
        }
      }

      // ---------- AI ANALYSIS ----------
      if (ai.executiveSummary) {
        doc.addPage();
        yPos = 50;
        doc.fillColor(...COLORS.dark);
        doc.fontSize(14).font('Helvetica-Bold').text('AI Analysis', leftMargin, yPos);
        yPos += 20;

        const aiSections = [
          { title: 'Executive Summary', text: ai.executiveSummary },
          { title: 'Business Analysis', text: ai.businessAnalysis },
          { title: 'Growth Analysis', text: ai.growthAnalysis },
          { title: 'Risk Analysis', text: ai.riskAnalysis },
          { title: 'Future Outlook', text: ai.futureOutlook },
          { title: 'Market Position', text: ai.marketPosition }
        ];

        for (const section of aiSections) {
          if (!section.text) continue;
          if (yPos > 700) {
            doc.addPage();
            yPos = 50;
          }
          doc.fillColor(...COLORS.accent);
          doc.fontSize(11).font('Helvetica-Bold').text(section.title, leftMargin, yPos);
          yPos += 16;
          doc.fillColor(...COLORS.dark);
          doc.fontSize(9).font('Helvetica').text(section.text, leftMargin, yPos, { width: pageWidth, align: 'justify' });
          const textHeight = doc.heightOfString(section.text, { width: pageWidth, align: 'justify' });
          yPos += textHeight + 12;
        }
      }

      // ---------- SWOT ANALYSIS ----------
      const swot = ai.swot || {};
      if (swot.strengths || swot.weaknesses) {
        doc.addPage();
        yPos = 50;
        doc.fillColor(...COLORS.dark);
        doc.fontSize(14).font('Helvetica-Bold').text('SWOT Analysis', leftMargin, yPos);
        yPos += 20;

        const swotItems = [
          { title: 'Strengths', items: swot.strengths, color: COLORS.success },
          { title: 'Weaknesses', items: swot.weaknesses, color: COLORS.danger },
          { title: 'Opportunities', items: swot.opportunities, color: COLORS.accent },
          { title: 'Threats', items: swot.threats, color: COLORS.warning }
        ];

        const swotW = pageWidth / 2 - 6;
        for (let i = 0; i < swotItems.length; i += 2) {
          for (let j = 0; j < 2 && i + j < swotItems.length; j++) {
            const s = swotItems[i + j];
            const sx = leftMargin + j * (swotW + 12);
            doc.roundedRect(sx, yPos, swotW, 20, 3).fill(...s.color);
            doc.fillColor(...COLORS.white).fontSize(9).font('Helvetica-Bold').text(s.title, sx + 8, yPos + 4);
          }
          yPos += 22;
          let maxH = 0;
          for (let j = 0; j < 2 && i + j < swotItems.length; j++) {
            const s = swotItems[i + j];
            const sx = leftMargin + j * (swotW + 12);
            doc.fillColor(...COLORS.dark).fontSize(8).font('Helvetica');
            let itemText = '';
            if (s.items && s.items.length > 0) {
              itemText = s.items.map(item => `- ${item}`).join('\n');
            } else {
              itemText = 'None listed';
            }
            doc.text(itemText, sx + 6, yPos, { width: swotW - 12 });
            const h = doc.heightOfString(itemText, { width: swotW - 12 });
            maxH = Math.max(maxH, h);
          }
          yPos += maxH + 10;
          if (yPos > 700) {
            doc.addPage();
            yPos = 50;
          }
        }
      }

      // ---------- RECOMMENDATION ----------
      if (rec.type) {
        doc.addPage();
        yPos = 50;
        const recColor = rec.type === 'INVEST' ? COLORS.success : rec.type === 'PASS' ? COLORS.danger : COLORS.warning;
        doc.roundedRect(leftMargin, yPos, pageWidth, 70, 6).fill(...recColor);
        doc.fillColor(...COLORS.white);
        doc.fontSize(22).font('Helvetica-Bold').text(`Recommendation: ${rec.type}`, leftMargin + 20, yPos + 12);
        doc.fontSize(11).font('Helvetica').text(`Confidence: ${rec.confidenceScore || 'N/A'}% | Investment Score: ${rec.investmentScore || 'N/A'}/100`, leftMargin + 20, yPos + 42);
        yPos += 85;

        if (rec.reasoning) {
          doc.fillColor(...COLORS.dark);
          doc.fontSize(9).font('Helvetica').text(rec.reasoning, leftMargin, yPos, { width: pageWidth, align: 'justify' });
          yPos += doc.heightOfString(rec.reasoning, { width: pageWidth, align: 'justify' }) + 15;
        }

        if (rec.strengths && rec.strengths.length > 0) {
          doc.fillColor(...COLORS.success);
          doc.fontSize(11).font('Helvetica-Bold').text('Key Strengths', leftMargin, yPos);
          yPos += 16;
          doc.fillColor(...COLORS.dark).fontSize(9).font('Helvetica');
          rec.strengths.forEach(s => {
            doc.text(`  \u2713  ${s}`, leftMargin, yPos, { width: pageWidth });
            yPos += 16;
          });
          yPos += 8;
        }

        if (rec.risks && rec.risks.length > 0) {
          doc.fillColor(...COLORS.danger);
          doc.fontSize(11).font('Helvetica-Bold').text('Key Risks', leftMargin, yPos);
          yPos += 16;
          doc.fillColor(...COLORS.dark).fontSize(9).font('Helvetica');
          rec.risks.forEach(r => {
            doc.text(`  \u2717  ${r}`, leftMargin, yPos, { width: pageWidth });
            yPos += 16;
          });
        }
      }

      // ---------- FOOTER ----------
      doc.addPage();
      yPos = 50;
      doc.fillColor(...COLORS.primary);
      doc.fontSize(16).font('Helvetica-Bold').text('Disclaimer', leftMargin, yPos);
      yPos += 28;
      doc.fillColor(...COLORS.dark);
      doc.fontSize(8).font('Helvetica');
      doc.text(`Report generated for ${report.companyName || report.symbol || 'N/A'} | ${new Date().toLocaleString()}`, leftMargin, yPos);
      yPos += 16;
      doc.text('This report is for informational purposes only and does not constitute financial advice. The AI-generated analysis is based on publicly available data and should not be the sole basis for investment decisions. Past performance does not guarantee future results. Consult a qualified financial advisor before making investment decisions.', leftMargin, yPos, { width: pageWidth, align: 'justify' });
      yPos += 40;
      doc.moveTo(leftMargin, yPos).lineTo(doc.page.width - leftMargin, yPos).strokeColor(...COLORS.muted).stroke();
      doc.fillColor(...COLORS.muted);
      doc.fontSize(7).font('Helvetica').text(`\u00A9 ${new Date().getFullYear()} AI Investment Agent. All data sourced from Yahoo Finance, News APIs, and AI analysis.`, leftMargin, yPos + 10, { align: 'center', width: pageWidth });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generatePDF };
