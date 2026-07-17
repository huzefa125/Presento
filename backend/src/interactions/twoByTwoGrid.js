const { randomUUID } = require('crypto');

function ensureGridItems(slide) {
  const items = Array.isArray(slide?.gridItems) ? slide.gridItems : [];
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
  const items = ensureGridItems(slide);
  if (!items.length) {
    throw new Error('2x2 Grid items are not configured');
  }

  const allowedIds = new Set(items.map((item) => item.id));
  
  if (!Array.isArray(answer)) {
    throw new Error('2x2 Grid answer must be an array of item positions');
  }

  // Get axis range for validation (same for both X and Y)
  const axisMin = slide?.gridAxisRange?.min ?? 0;
  const axisMax = slide?.gridAxisRange?.max ?? 10;

  const positions = [];
  const seen = new Set();

  answer.forEach((position) => {
    if (!position || typeof position !== 'object') return;
    
    const itemId = typeof position.item === 'string' ? position.item.trim() : null;
    const x = typeof position.x === 'number' ? position.x : null;
    const y = typeof position.y === 'number' ? position.y : null;

    if (!itemId || seen.has(itemId)) return;
    if (!allowedIds.has(itemId)) {
      throw new Error('Position contains an unknown item');
    }
    if (x === null || y === null) {
      throw new Error('Both x and y coordinates are required');
    }
    // Validate against actual axis range
    if (x < axisMin || x > axisMax || y < axisMin || y > axisMax) {
      throw new Error(`Coordinates must be within axis range: [${axisMin}, ${axisMax}]`);
    }

    seen.add(itemId);
    positions.push({
      item: itemId,
      x: Number(x),
      y: Number(y)
    });
  });

  if (positions.length === 0) {
    throw new Error('Please position at least one item on the grid');
  }

  return positions;
}

function buildResults(slide, responses) {
  const items = ensureGridItems(slide);
  const itemsMap = new Map();

  items.forEach((item) => {
    itemsMap.set(item.id, {
      id: item.id,
      label: item.label,
      positions: []
    });
  });

  responses.forEach((response) => {
    const positions = Array.isArray(response.answer) ? response.answer : [];
    
    positions.forEach((position) => {
      if (!position || typeof position !== 'object') return;
      
      const itemId = position.item;
      const x = typeof position.x === 'number' ? position.x : null;
      const y = typeof position.y === 'number' ? position.y : null;

      if (!itemsMap.has(itemId) || x === null || y === null) return;
      
      const entry = itemsMap.get(itemId);
      entry.positions.push({ x, y });
    });
  });

  const results = Array.from(itemsMap.values()).map((entry) => ({
    itemId: entry.id, // Use itemId for consistency with frontend
    id: entry.id, // Keep id for backward compatibility
    label: entry.label,
    positions: entry.positions,
    count: entry.positions.length,
    averageX: entry.positions.length > 0 
      ? Math.round((entry.positions.reduce((sum, p) => sum + p.x, 0) / entry.positions.length) * 10) / 10
      : 0,
    averageY: entry.positions.length > 0 
      ? Math.round((entry.positions.reduce((sum, p) => sum + p.y, 0) / entry.positions.length) * 10) / 10
      : 0
  }));

  return {
    gridResults: results
  };
}

module.exports = { normalizeAnswer, buildResults };
