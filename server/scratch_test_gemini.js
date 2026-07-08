const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function run() {
  try {
    console.log('Gemini API Key:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    console.log('Generating content...');
    const result = await model.generateContent('Say hello');
    const response = await result.response;
    console.log('Response:', response.text());
  } catch (err) {
    console.error('Gemini error:', err);
  }
}

run();
