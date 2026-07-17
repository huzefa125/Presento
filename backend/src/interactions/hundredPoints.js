const { randomUUID } = require('crypto');

function ensureHundredPointsItems(slide) {
  const items = Array.isArray(slide?.hundredPointsItems) ? slide.hundredPointsItems : [];
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
  const items = ensureHundredPointsItems(slide);
  if (!items.length) {
    throw new Error('100 Points items are not configured');
  }

  const allowedIds = new Set(items.map((item) => item.id));
  
  if (!Array.isArray(answer)) {
    throw new Error('100 Points answer must be an array of allocations');
  }

  const allocations = [];
  const seen = new Set();
  let totalPoints = 0;

  answer.forEach((allocation) => {
    if (!allocation || typeof allocation !== 'object') return;
    
    const itemId = typeof allocation.item === 'string' ? allocation.item.trim() : null;
    const points = typeof allocation.points === 'number' ? allocation.points : 0;

    if (!itemId || seen.has(itemId)) return;
    if (!allowedIds.has(itemId)) {
      throw new Error('Allocation contains an unknown item');
    }
    if (points < 0) {
      throw new Error('Points cannot be negative');
    }
    if (!Number.isInteger(points)) {
      throw new Error('Points must be whole numbers');
    }

    seen.add(itemId);
    totalPoints += points;
    
    if (points > 0) {
      allocations.push({
        item: itemId,
        points
      });
    }
  });

  if (totalPoints > 100) {
    throw new Error('Total points cannot exceed 100');
  }

  if (allocations.length === 0) {
    throw new Error('Please allocate at least some points');
  }

  return allocations;
}

function buildResults(slide, responses) {
  const items = ensureHundredPointsItems(slide);
  const pointsMap = new Map();

  items.forEach((item) => {
    pointsMap.set(item.id, {
      id: item.id,
      label: item.label,
      totalPoints: 0,
      participantCount: 0
    });
  });

  responses.forEach((response) => {
    const allocations = Array.isArray(response.answer) ? response.answer : [];
    const participantItems = new Set();

    allocations.forEach((allocation) => {
      if (!allocation || typeof allocation !== 'object') return;
      
      const itemId = allocation.item;
      const points = typeof allocation.points === 'number' ? allocation.points : 0;

      if (!pointsMap.has(itemId)) return;
      
      const entry = pointsMap.get(itemId);
      entry.totalPoints += points;
      
      if (!participantItems.has(itemId)) {
        entry.participantCount += 1;
        participantItems.add(itemId);
      }
    });
  });

  const results = Array.from(pointsMap.values()).map((entry) => ({
    itemId: entry.id, // Use itemId for consistency with frontend
    id: entry.id, // Keep id for backward compatibility
    label: entry.label,
    totalPoints: entry.totalPoints,
    participantCount: entry.participantCount,
    averagePoints: entry.participantCount > 0 
      ? Number((entry.totalPoints / entry.participantCount).toFixed(1))
      : 0
  }));

  // Sort by total points descending
  results.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    return a.label.localeCompare(b.label);
  });

  return {
    hundredPointsResults: results
  };
}

module.exports = { normalizeAnswer, buildResults };
