const { GoogleGenerativeAI } = require('@google/generative-ai');

if (!process.env.GEMINI_API_KEY) {
  console.error('CRITICAL: GEMINI_API_KEY is not set in server/.env');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const FALLBACK_MODELS = [
  DEFAULT_MODEL,
  'gemini-2.0-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash'
];

const extractJsonFromText = (text) => {
  if (!text) {
    throw new Error('Gemini returned an empty response.');
  }

  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch (error) {
    const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fencedMatch) {
      return JSON.parse(fencedMatch[1]);
    }

    const objectStart = trimmed.indexOf('{');
    const objectEnd = trimmed.lastIndexOf('}');
    if (objectStart !== -1 && objectEnd > objectStart) {
      return JSON.parse(trimmed.slice(objectStart, objectEnd + 1));
    }

    const arrayStart = trimmed.indexOf('[');
    const arrayEnd = trimmed.lastIndexOf(']');
    if (arrayStart !== -1 && arrayEnd > arrayStart) {
      return JSON.parse(trimmed.slice(arrayStart, arrayEnd + 1));
    }

    throw error;
  }
};

const shouldTryNextModel = (error) => {
  const message = error?.message || '';
  return error?.status === 404 || message.includes('not found') || message.includes('not supported');
};

const withModelFallback = async (runner) => {
  let lastError;

  for (const modelName of FALLBACK_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      return await runner(model, modelName);
    } catch (error) {
      lastError = error;

      if (!shouldTryNextModel(error) || modelName === FALLBACK_MODELS[FALLBACK_MODELS.length - 1]) {
        throw error;
      }

      console.warn(`Gemini model ${modelName} unavailable, trying next fallback.`);
    }
  }

  throw lastError;
};

const generateJsonFromAI = async (prompt) => {
  try {
    return await withModelFallback(async (model, modelName) => {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      });

      const rawText = result.response.text();
      const parsed = extractJsonFromText(rawText);

      console.log(`Gemini JSON response generated with ${modelName}.`);
      return parsed;
    });
  } catch (error) {
    console.error('Gemini API Helper Error:', error);
    const wrappedError = new Error('Failed to generate AI response.');
    wrappedError.code = 'GEMINI_UNAVAILABLE';
    wrappedError.status = error?.status;
    throw wrappedError;
  }
};

const generateTextFromAI = async (prompt) => {
  try {
    return await withModelFallback(async (model, modelName) => {
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();

      console.log(`Gemini text response generated with ${modelName}.`);
      return text;
    });
  } catch (error) {
    console.error('Gemini API (Text) Helper Error:', error);
    const wrappedError = new Error('Failed to generate AI text response.');
    wrappedError.code = 'GEMINI_UNAVAILABLE';
    wrappedError.status = error?.status;
    throw wrappedError;
  }
};

module.exports = { generateJsonFromAI, generateTextFromAI };
