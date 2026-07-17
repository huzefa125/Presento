function coerceToNumber(value) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return parsed;
}

function getScaleBounds(slide) {
  const minValue = typeof slide?.minValue === 'number' ? slide.minValue : 1;
  const maxValue = typeof slide?.maxValue === 'number' ? slide.maxValue : 5;

  if (minValue >= maxValue) {
    return { minValue: 1, maxValue: 5 };
  }

  return { minValue, maxValue };
}

function normalizeAnswer(answer, slide) {
  const statements = Array.isArray(slide?.statements) ? slide.statements.filter(Boolean) : [];
  const { minValue, maxValue } = getScaleBounds(slide);

  // Multi-statement: expect one value per statement
  if (statements.length > 0) {
    let rawValues = [];

    if (Array.isArray(answer)) {
      rawValues = answer.slice(0, statements.length);
    } else if (answer && typeof answer === 'object') {
      rawValues = statements.map((_, index) => answer[index] ?? answer[String(index)]);
    } else {
      throw new Error('Please rate each statement on the scale');
    }

    if (rawValues.length !== statements.length) {
      throw new Error('Please rate each statement on the scale');
    }

    const normalized = rawValues.map((value, index) => {
      const numeric = coerceToNumber(value);
      if (numeric === null) {
        throw new Error(`Statement ${index + 1} must be a number`);
      }
      if (numeric < minValue || numeric > maxValue) {
        throw new Error(`Statement ${index + 1} must be between ${minValue} and ${maxValue}`);
      }
      return numeric;
    });

    return normalized;
  }

  // Single-statement slide
  const numericAnswer = coerceToNumber(answer);
  if (numericAnswer === null) {
    throw new Error('Invalid scale value');
  }
  if (numericAnswer < minValue || numericAnswer > maxValue) {
    throw new Error(`Scale value must be between ${minValue} and ${maxValue}`);
  }
  return numericAnswer;
}

function buildResults(slide, responses) {
  const statements = Array.isArray(slide?.statements) ? slide.statements.filter(Boolean) : [];
  const { minValue, maxValue } = getScaleBounds(slide);

  if (statements.length > 0) {
    const totals = Array(statements.length).fill(0);
    const counts = Array(statements.length).fill(0);

    responses.forEach((response) => {
      const values = Array.isArray(response.answer)
        ? response.answer
        : response && typeof response.answer === 'object'
          ? statements.map((_, index) => response.answer[index] ?? response.answer[String(index)])
          : null;

      if (!values) return;

      statements.forEach((_, index) => {
        const numeric = coerceToNumber(values[index]);
        if (numeric === null) return;
        if (numeric < minValue || numeric > maxValue) return;
        totals[index] += numeric;
        counts[index] += 1;
      });
    });

    const averages = totals.map((total, index) => (counts[index] > 0 ? Number((total / counts[index]).toFixed(2)) : 0));

    const overallSum = totals.reduce((sum, value) => sum + value, 0);
    const overallCount = counts.reduce((sum, value) => sum + value, 0);
    const overallAverage = overallCount > 0 ? Number((overallSum / overallCount).toFixed(2)) : 0;

    return {
      scaleStatements: statements,
      scaleStatementAverages: averages,
      statementCounts: counts,
      scaleOverallAverage: overallAverage,
      scaleMin: minValue,
      scaleMax: maxValue,
      totalResponses: responses.length
    };
  }

  // Single-statement fallback
  const distribution = {};
  for (let value = minValue; value <= maxValue; value += 1) {
    distribution[value] = 0;
  }

  let sum = 0;
  responses.forEach((response) => {
    const numeric = coerceToNumber(response.answer);
    if (numeric === null) return;
    if (numeric < minValue || numeric > maxValue) return;
    distribution[numeric] += 1;
    sum += numeric;
  });

  const average = responses.length > 0 ? Number((sum / responses.length).toFixed(2)) : 0;

  return {
    scaleDistribution: distribution,
    scaleAverage: average,
    scaleMin: minValue,
    scaleMax: maxValue,
    totalResponses: responses.length
  };
}

module.exports = { normalizeAnswer, buildResults };
