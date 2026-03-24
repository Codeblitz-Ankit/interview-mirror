const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Use this for plain text responses
const askGemini = async (prompt) => {
  const result = await model.generateContent(prompt);
  return result.response.text();
};

// Use this when you need JSON back from Gemini
const askGeminiJSON = async (prompt) => {
  const text = await askGemini(prompt);
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
};

module.exports = { askGemini, askGeminiJSON };