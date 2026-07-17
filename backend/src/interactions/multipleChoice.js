// Handlers for multiple_choice interaction

function buildResults(slide, responses) {
  const voteCounts = {};
  // Initialize all options with 0 votes, ensuring keys are strings
  (slide.options || []).forEach(option => {
    const key = String(option).trim();
    voteCounts[key] = 0;
  });
  responses.forEach(r => {
    // Handle both string and array answers, normalize to match option keys
    const answer = Array.isArray(r.answer) ? r.answer[0] : r.answer;
    const normalizedAnswer = String(answer).trim();
    // Check if the normalized answer exists as a key (case-sensitive match)
    if (voteCounts.hasOwnProperty(normalizedAnswer)) {
      voteCounts[normalizedAnswer]++;
    } else {
      // Fallback: try to find a matching key (in case of type mismatch)
      const matchingKey = Object.keys(voteCounts).find(key => String(key).trim() === normalizedAnswer);
      if (matchingKey) {
        voteCounts[matchingKey]++;
      }
    }
  });
  return { voteCounts };
}

function normalizeAnswer(answer, slide) {
  const val = typeof answer === 'string' ? answer : (Array.isArray(answer) ? answer[0] : '');
  const trimmed = String(val).trim();
  if (!trimmed) throw new Error('Please select an answer');
  if (Array.isArray(slide.options) && !slide.options.includes(trimmed)) {
    throw new Error('Invalid option');
  }
  return trimmed;
}

module.exports = { buildResults, normalizeAnswer };