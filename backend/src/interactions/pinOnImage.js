/**
 * Pin on Image Interaction Handler
 * Validates and processes pin placement responses
 */

function normalizeAnswer(answer, slide) {
  if (!slide?.pinOnImageSettings) {
    throw new Error('Pin on image settings are not configured');
  }

  // Answer should be a single pin object {x, y}
  if (!answer || typeof answer !== 'object') {
    throw new Error('Please place a pin on the image');
  }

  const x = typeof answer.x === 'number' ? answer.x : null;
  const y = typeof answer.y === 'number' ? answer.y : null;

  if (x === null || y === null) {
    throw new Error('Both x and y coordinates are required');
  }

  // Validate coordinates are within 0-100 range (percentage)
  if (x < 0 || x > 100 || y < 0 || y > 100) {
    throw new Error('Pin coordinates must be between 0 and 100 (percentage)');
  }

  return {
    x: Math.round(x * 100) / 100, // Round to 2 decimal places
    y: Math.round(y * 100) / 100
  };
}

function buildResults(slide, responses) {
  const allPins = [];

  responses.forEach((response) => {
    const pin = response.answer;
    
    if (!pin || typeof pin !== 'object') return;
    
    const x = typeof pin.x === 'number' ? pin.x : null;
    const y = typeof pin.y === 'number' ? pin.y : null;

    if (x === null || y === null) return;
    
    allPins.push({
      x,
      y,
      userId: response.userId || 'anonymous'
    });
  });

  return {
    pinResults: allPins,
    totalPins: allPins.length
  };
}

module.exports = { normalizeAnswer, buildResults };
