// Handlers for compare_slides interaction

function buildResults(slide, responses) {
  const voteCounts = { A: 0, B: 0 };
  responses.forEach(r => {
    const answer = Array.isArray(r.answer) ? r.answer[0] : r.answer;
    if (answer === 'A' || answer === 'B') {
      voteCounts[answer]++;
    }
  });
  return { voteCounts };
}

function normalizeAnswer(answer) {
  const val = typeof answer === 'string' ? answer : (Array.isArray(answer) ? answer[0] : '');
  const trimmed = String(val).trim().toUpperCase();
  if (trimmed !== 'A' && trimmed !== 'B') {
    throw new Error('Please select an option');
  }
  return trimmed;
}

module.exports = { buildResults, normalizeAnswer };
