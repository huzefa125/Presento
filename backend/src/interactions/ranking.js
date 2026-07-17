const { randomUUID } = require('crypto');

function ensureRankingItems(slide) {
  const items = Array.isArray(slide?.rankingItems) ? slide.rankingItems : [];
  return items
    .map((item) => {
      if (!item) return null;
      const id = typeof item.id === 'string' && item.id.trim().length > 0
        ? item.id.trim()
        : null;
      const label = typeof item.label === 'string' && item.label.trim().length > 0
        ? item.label.trim()
        : null;
      if (!label) return null;
      return {
        id: id || randomUUID(),
        label
      };
    })
    .filter(Boolean);
}

function normalizeAnswer(answer, slide) {
  const items = ensureRankingItems(slide);
  if (!items.length) {
    throw new Error('Ranking items are not configured');
  }

  const allowedIds = new Set(items.map((item) => item.id));
  if (!Array.isArray(answer)) {
    throw new Error('Ranking answer must be an ordered list of item IDs');
  }

  const sanitized = [];
  const seen = new Set();
  answer.forEach((raw) => {
    if (typeof raw !== 'string') return;
    const trimmed = raw.trim();
    if (!trimmed || seen.has(trimmed)) return;
    if (!allowedIds.has(trimmed)) {
      throw new Error('Ranking contains an unknown item');
    }
    sanitized.push(trimmed);
    seen.add(trimmed);
  });

  if (!sanitized.length) {
    throw new Error('Please rank at least one item');
  }

  return sanitized;
}

function buildResults(slide, responses) {
  const items = ensureRankingItems(slide);
  const itemCount = items.length;
  const scoreMap = new Map();

  items.forEach((item) => {
    scoreMap.set(item.id, {
      id: item.id,
      label: item.label,
      score: 0,
      count: 0,
      totalPosition: 0
    });
  });

  responses.forEach((response) => {
    const rankedIds = Array.isArray(response.answer) ? response.answer : [];

    rankedIds.forEach((itemId, index) => {
      if (!scoreMap.has(itemId)) return;
      const entry = scoreMap.get(itemId);
      const position = index + 1;
      const points = itemCount - index;
      entry.score += points;
      entry.count += 1;
      entry.totalPosition += position;
    });
  });

  const rankedItems = Array.from(scoreMap.values()).map((entry) => ({
    itemId: entry.id, // Use itemId for consistency with frontend
    id: entry.id, // Keep id for backward compatibility
    label: entry.label,
    score: entry.score,
    averageRank: entry.count > 0 ? Number((entry.totalPosition / entry.count).toFixed(2)) : 0, // Use averageRank for frontend compatibility
    averagePosition: entry.count > 0 ? Number((entry.totalPosition / entry.count).toFixed(2)) : null, // Keep for backward compatibility
    responseCount: entry.count
  }));

  rankedItems.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Use averageRank for sorting (it's always a number, never null)
    if (a.averageRank !== b.averageRank) return a.averageRank - b.averageRank;
    // Fallback to averagePosition if averageRank is the same
    if (a.averagePosition === null && b.averagePosition === null) return 0;
    if (a.averagePosition === null) return 1;
    if (b.averagePosition === null) return -1;
    return a.averagePosition - b.averagePosition;
  });

  return {
    rankingResults: rankedItems
  };
}

module.exports = { normalizeAnswer, buildResults };
