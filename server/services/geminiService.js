const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MODELS = [
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-flash-latest',
  'gemini-pro-latest'
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const isRateLimitError = (e) => {
  const msg = (e.message || '').toLowerCase();
  const status = e.status || e.code || 0;
  return status === 429 || msg.includes('quota') || msg.includes('rate limit') || msg.includes('too many requests') || msg.includes('resource exhausted');
};

const isModelNotFoundError = (e) => {
  const msg = (e.message || '').toLowerCase();
  return msg.includes('not found') || msg.includes('not supported') || msg.includes('not supported for generatecontent');
};

const getGeminiModel = () => {
  return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
};

const generateWithFallback = async (prompt) => {
  let lastError;
  for (const modelName of MODELS) {
    let retries = 3;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        return await result.response;
      } catch (e) {
        lastError = e;
        if (isRateLimitError(e)) {
          if (attempt < retries) {
            const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
            console.warn(`Rate limited on ${modelName}, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`);
            await sleep(delay);
            continue;
          }
          break;
        }
        if (isModelNotFoundError(e)) {
          break;
        }
        throw e;
      }
    }
  }
  throw lastError;
};

const generateContent = async (prompt) => {
  try {
    const response = await generateWithFallback(prompt);
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error.message);
    throw new Error('AI generation failed');
  }
};

const generateStructuredJSON = async (prompt, schemaDescription) => {
  try {
    const fullPrompt = `${prompt}\n\nIMPORTANT: You must respond with ONLY valid JSON. No markdown formatting, no code blocks, no extra text. The JSON must match this structure:\n${schemaDescription}\n\nResponse:`;

    const result = await generateWithFallback(fullPrompt);
    let text = result.text().trim();
    text = text.replace(/```json?/gi, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error('Gemini structured JSON error:', error.message);
    throw new Error('AI analysis failed');
  }
};

module.exports = { generateContent, generateStructuredJSON };
