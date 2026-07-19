const { GoogleGenAI } = require('@google/genai');
const crypto = require('crypto');
const Logger = require('../utils/logger');

const MODEL = 'gemini-flash-latest';

// Slide types an LLM can meaningfully generate on its own - anything that needs a
// real uploaded asset (image/video/pdf/pin-on-image) or an external URL (miro/
// powerpoint/google_slides) is intentionally excluded.
const GENERATABLE_TYPES = new Set([
  'multiple_choice',
  'quiz',
  'word_cloud',
  'open_ended',
  'scales',
  'ranking',
  'qna',
  'guess_number',
  'hundred_points',
  '2x2_grid',
  'text',
  'instruction',
]);

let client = null;
const getClient = () => {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
};

const isGeminiConfigured = () => Boolean(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are a presentation-design assistant for an audience-engagement tool similar to Mentimeter.
Given a user's topic/goal and a target slide count, output a JSON object describing a complete presentation.

Output STRICT JSON only, matching this shape exactly (no markdown fences, no commentary):
{
  "title": "string, short presentation title",
  "slides": [ <slide>, ... ]
}

Each <slide> MUST have a "type" field set to one of exactly these values, and MUST include that type's fields:

- "multiple_choice": { "type": "multiple_choice", "question": "string", "options": ["string", "string", ...] }  (2-6 options)
- "quiz": { "type": "quiz", "question": "string", "options": ["string", "string", ...], "correctOptionIndex": 0, "timeLimit": 30, "points": 1000 }  (2-6 options, correctOptionIndex is a 0-based index into options)
- "word_cloud": { "type": "word_cloud", "question": "string", "maxWordsPerParticipant": 1-5 }
- "open_ended": { "type": "open_ended", "question": "string" }
- "scales": { "type": "scales", "question": "string", "minValue": number, "maxValue": number, "minLabel": "string", "maxLabel": "string" }  (minValue < maxValue)
- "ranking": { "type": "ranking", "question": "string", "items": ["string", "string", ...] }  (2-8 items)
- "qna": { "type": "qna", "question": "string" }
- "guess_number": { "type": "guess_number", "question": "string", "minValue": number, "maxValue": number, "correctAnswer": number }  (minValue < correctAnswer < maxValue)
- "hundred_points": { "type": "hundred_points", "question": "string", "items": ["string", "string", ...] }  (2-6 items)
- "2x2_grid": { "type": "2x2_grid", "question": "string", "items": ["string", "string", ...], "xAxisLabel": "string", "yAxisLabel": "string" }  (2-6 items, axis labels are short opposite-pole pairs like "Low effort ... High effort")
- "text": { "type": "text", "question": "string, a section heading", "textContent": "string, 1-3 sentences of body text" }
- "instruction": { "type": "instruction", "question": "string, a heading", "instructionContent": "string, 1-3 sentences of instructions for participants" }

Guidelines:
- Vary slide types - do not repeat the same type more than twice in a row, and do not use only one type for the whole deck.
- Open with a lightweight/fun slide (e.g. word_cloud or scales) when it fits the topic, and close with something that wraps up (e.g. open_ended or qna) when it fits.
- Keep questions concise and directly relevant to the user's prompt.
- Output exactly the requested number of slides.
- Output ONLY the JSON object, nothing else.`;

/**
 * Ask Gemini for a full presentation outline for the given prompt, and return it
 * normalized into the shape the frontend/backend Slide model expects.
 * @param {string} prompt - User's description of what the presentation should cover
 * @param {number} slideCount - Desired number of slides (already clamped by caller)
 * @returns {Promise<{title: string, slides: Array<Object>}>}
 */
async function generatePresentationOutline(prompt, slideCount) {
  const ai = getClient();
  if (!ai) {
    throw new Error('AI generation is not configured on this server');
  }

  const userPrompt = `Topic/goal: ${prompt}\nTarget slide count: ${slideCount}`;

  let response;
  try {
    response = await ai.models.generateContent({
      model: MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        temperature: 0.8,
        topP: 0.9,
        maxOutputTokens: 8192,
      },
    });
  } catch (error) {
    Logger.error('Gemini generateContent error', error);
    throw new Error('Failed to reach the AI service');
  }

  const rawText = response?.text;
  if (!rawText) {
    throw new Error('AI service returned an empty response');
  }

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch (error) {
    Logger.error('Gemini response was not valid JSON', { rawText, error: error.message });
    throw new Error('AI service returned an unexpected format');
  }

  const rawSlides = Array.isArray(parsed?.slides) ? parsed.slides : [];
  const slides = rawSlides
    .map((slide) => normalizeSlide(slide))
    .filter(Boolean)
    .slice(0, Math.max(slideCount * 2, 20)); // hard ceiling regardless of what the model returned

  if (slides.length === 0) {
    throw new Error('AI did not return any usable slides');
  }

  const title = typeof parsed?.title === 'string' && parsed.title.trim()
    ? parsed.title.trim().slice(0, 120)
    : 'AI Generated Presentation';

  return { title, slides };
}

const genId = () => crypto.randomUUID();

const clampNumber = (value, min, max, fallback) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
};

const sanitizeStringArray = (arr, minLen, maxLen, fallbackPrefix) => {
  const cleaned = (Array.isArray(arr) ? arr : [])
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
    .slice(0, maxLen);

  while (cleaned.length < minLen) {
    cleaned.push(`${fallbackPrefix} ${cleaned.length + 1}`);
  }

  return cleaned;
};

/**
 * Validate + coerce one raw slide object from the model into the shape the
 * frontend's "unsaved slide" objects use (same shape as the template-creation
 * flow in Dashboard.jsx), or return null to drop an unusable slide.
 */
function normalizeSlide(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (!GENERATABLE_TYPES.has(raw.type)) return null;

  const question = typeof raw.question === 'string' && raw.question.trim()
    ? raw.question.trim().slice(0, 500)
    : null;
  if (!question) return null;

  const base = { id: `temp-${genId()}`, type: raw.type, question };

  switch (raw.type) {
    case 'multiple_choice': {
      base.options = sanitizeStringArray(raw.options, 2, 6, 'Option');
      return base;
    }

    case 'quiz': {
      const options = sanitizeStringArray(raw.options, 2, 6, 'Option');
      const optionObjs = options.map((text) => ({ id: genId(), text }));
      const correctIndex = clampNumber(raw.correctOptionIndex, 0, optionObjs.length - 1, 0);
      base.quizSettings = {
        options: optionObjs,
        correctOptionId: optionObjs[correctIndex]?.id || optionObjs[0]?.id,
        timeLimit: clampNumber(raw.timeLimit, 5, 300, 30),
        points: clampNumber(raw.points, 0, 10000, 1000),
      };
      return base;
    }

    case 'word_cloud': {
      base.maxWordsPerParticipant = clampNumber(raw.maxWordsPerParticipant, 1, 10, 1);
      return base;
    }

    case 'open_ended':
    case 'qna': {
      return base;
    }

    case 'scales': {
      let min = clampNumber(raw.minValue, 0, 100, 1);
      let max = clampNumber(raw.maxValue, 0, 100, 5);
      if (min >= max) { min = 1; max = 5; }
      base.minValue = min;
      base.maxValue = max;
      base.minLabel = typeof raw.minLabel === 'string' ? raw.minLabel.trim().slice(0, 60) : '';
      base.maxLabel = typeof raw.maxLabel === 'string' ? raw.maxLabel.trim().slice(0, 60) : '';
      return base;
    }

    case 'ranking': {
      const items = sanitizeStringArray(raw.items, 2, 8, 'Item');
      base.rankingItems = items.map((label) => ({ id: genId(), label }));
      return base;
    }

    case 'guess_number': {
      let min = clampNumber(raw.minValue, 0, 1000, 1);
      let max = clampNumber(raw.maxValue, 0, 1000, 10);
      if (min >= max) { min = 1; max = 10; }
      let correct = clampNumber(raw.correctAnswer, min, max, Math.round((min + max) / 2));
      base.guessNumberSettings = { minValue: min, maxValue: max, correctAnswer: correct };
      return base;
    }

    case 'hundred_points': {
      const items = sanitizeStringArray(raw.items, 2, 6, 'Item');
      base.hundredPointsItems = items.map((label) => ({ id: genId(), label }));
      return base;
    }

    case '2x2_grid': {
      const items = sanitizeStringArray(raw.items, 2, 6, 'Item');
      base.gridItems = items.map((label) => ({ id: genId(), label }));
      base.gridAxisXLabel = typeof raw.xAxisLabel === 'string' ? raw.xAxisLabel.trim().slice(0, 60) : '';
      base.gridAxisYLabel = typeof raw.yAxisLabel === 'string' ? raw.yAxisLabel.trim().slice(0, 60) : '';
      base.gridAxisRange = { min: 0, max: 10 };
      return base;
    }

    case 'text': {
      base.textContent = typeof raw.textContent === 'string' ? raw.textContent.trim().slice(0, 1000) : '';
      return base;
    }

    case 'instruction': {
      base.instructionContent = typeof raw.instructionContent === 'string' ? raw.instructionContent.trim().slice(0, 1000) : '';
      return base;
    }

    default:
      return null;
  }
}

module.exports = {
  generatePresentationOutline,
  isGeminiConfigured,
  GENERATABLE_TYPES,
};
