// Handlers for word_cloud interaction

const MAX_WORD_LENGTH = 20;

function sanitizeWord(input) {
  return String(input)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function buildResults(_slide, responses) {
  const wordFrequencies = {};
  responses.forEach(r => {
    const ans = r.answer;
    const words = Array.isArray(ans) ? ans : (typeof ans === 'string' ? [ans] : []);
    words.forEach(w => {
      const word = sanitizeWord(w);
      if (!word) return;
      wordFrequencies[word] = (wordFrequencies[word] || 0) + 1;
    });
  });
  return { wordFrequencies };
}

function normalizeAnswer(answer, slide) {
  const rawTokens = Array.isArray(answer)
    ? answer
    : String(answer || '')
        .split(/[^a-zA-Z0-9]+/);

  const sanitizedTokens = [];
  for (const token of rawTokens) {
    const word = sanitizeWord(token);
    if (!word) continue;
    if (word.length > MAX_WORD_LENGTH) {
      throw new Error(`Words must be ${MAX_WORD_LENGTH} characters or fewer`);
    }
    sanitizedTokens.push(word);
    // Remove the break statement to allow multiple words
  }

  if (!sanitizedTokens.length) {
    throw new Error('Please enter at least one valid word');
  }

  return sanitizedTokens;
}

module.exports = { buildResults, normalizeAnswer };