import * as XLSX from 'xlsx';

/**
 * Export utilities for CSV and Excel formats
 */

const normalizeResponse = (response) => {
  if (!response || typeof response !== 'object') {
    return {
      participantName: 'Anonymous',
      participantId: 'N/A',
      answer: null,
      createdAt: null,
      votes: 0,
      isCorrect: false,
      responseTime: null
    };
  }
  return {
    participantName: response.participantName || 'Anonymous',
    participantId: response.participantId || 'N/A',
    answer: response.answer,
    createdAt: response.createdAt || response.created_at,
    votes: response.votes || response.voteCount || 0,
    isCorrect: Boolean(response.isCorrect),
    responseTime: response.responseTime || response.response_time || null
  };
};

const formatParticipantName = (name) => name || 'Anonymous';
const formatParticipantId = (id) => id || 'N/A';
const formatDate = (date) => {
  if (!date) return 'N/A';
  try {
    return new Date(date).toLocaleString();
  } catch {
    return 'N/A';
  }
};
const formatPercentage = (count, total) => {
  if (!total || total === 0) return '0.00%';
  return `${((count / total) * 100).toFixed(2)}%`;
};
const safeArray = (value) => Array.isArray(value) ? value : (value != null ? [value] : []);
const safeArrayFirst = (value) => {
  const arr = safeArray(value);
  return arr.length > 0 ? arr[0] : null;
};

/**
 * Format data for export based on slide type
 */
export const formatSlideDataForExport = (slide, responses, aggregatedData = {}) => {
  if (!slide || typeof slide !== 'object') {
    slide = {};
  }
  if (!Array.isArray(responses)) {
    responses = [];
  }
  if (!aggregatedData || typeof aggregatedData !== 'object') {
    aggregatedData = {};
  }

  const normalizedResponses = responses.map(normalizeResponse);
  const slideType = slide.type || 'unknown';
  const question = slide.question || 'No question';
  const timestamp = new Date().toLocaleString();

  switch (slideType) {
    case 'multiple_choice':
    case 'pick_answer':
      return formatChoiceData(slide, normalizedResponses, aggregatedData, question, timestamp);
    
    case 'word_cloud':
      return formatWordCloudData(slide, normalizedResponses, aggregatedData, question, timestamp);
    
    case 'open_ended':
    case 'type_answer':
      return formatOpenEndedData(slide, normalizedResponses, aggregatedData, question, timestamp);
    
    case 'scales':
      return formatScalesData(slide, normalizedResponses, aggregatedData, question, timestamp);
    
    case 'ranking':
      return formatRankingData(slide, normalizedResponses, aggregatedData, question, timestamp);
    
    case 'hundred_points':
      return formatHundredPointsData(slide, normalizedResponses, aggregatedData, question, timestamp);
    
    case '2x2_grid':
      return formatGridData(slide, normalizedResponses, aggregatedData, question, timestamp);
    
    case 'pin_on_image':
      return formatPinOnImageData(slide, normalizedResponses, aggregatedData, question, timestamp);
    
    case 'guess_number':
      return formatGuessNumberData(slide, normalizedResponses, aggregatedData, question, timestamp);
    
    case 'quiz':
      return formatQuizData(slide, normalizedResponses, aggregatedData, question, timestamp);
    
    case 'qna':
      return formatQnaData(slide, normalizedResponses, aggregatedData, question, timestamp);
    
    case 'leaderboard':
      return formatLeaderboardData(slide, normalizedResponses, aggregatedData, question, timestamp);
    
    case 'instruction':
      return formatInstructionData(slide, normalizedResponses, aggregatedData, question, timestamp);
    
    default:
      return formatGenericData(slide, normalizedResponses, question, timestamp);
  }
};

/**
 * Format choice-based data (MCQ, Pick Answer)
 */
const formatChoiceData = (slide, responses, aggregatedData, question, timestamp) => {
  const options = Array.isArray(slide?.options) ? slide.options : [];
  const voteCounts = aggregatedData?.voteCounts || {};
  const totalResponses = aggregatedData?.totalResponses || (Array.isArray(responses) ? responses.length : 0);

  const detailedRows = responses.map((response, index) => ({
    'Response #': index + 1,
    'Participant Name': formatParticipantName(response.participantName),
    'Participant ID': formatParticipantId(response.participantId),
    'Selected Option': safeArrayFirst(response.answer) || 'N/A',
    'Submitted At': formatDate(response.createdAt)
  }));

  const summaryRows = options.map(option => {
    const optionText = typeof option === 'string' ? option : (option?.text || String(option || ''));
    const count = voteCounts[optionText] || 0;
    return {
      'Option': optionText,
      'Votes': count,
      'Percentage': formatPercentage(count, totalResponses),
      'Total Responses': totalResponses
    };
  });

  return {
    question,
    timestamp,
    slideType: slide.type,
    summary: summaryRows,
    detailed: detailedRows,
    metadata: {
      totalResponses,
      totalOptions: options.length
    }
  };
};

/**
 * Format word cloud data
 */
const formatWordCloudData = (slide, responses, aggregatedData, question, timestamp) => {
  const wordFrequencies = aggregatedData?.wordFrequencies || {};
  const totalResponses = aggregatedData?.totalResponses || (Array.isArray(responses) ? responses.length : 0);

  const summaryRows = Object.entries(wordFrequencies)
    .filter(([word]) => word != null && word !== '')
    .sort((a, b) => (b[1] || 0) - (a[1] || 0))
    .map(([word, frequency]) => ({
      'Word': String(word),
      'Frequency': Number(frequency) || 0,
      'Percentage': formatPercentage(frequency || 0, totalResponses)
    }));

  const detailedRows = responses.map((response, index) => {
    const words = safeArray(response.answer).filter(w => w != null && w !== '');
    return {
      'Response #': index + 1,
      'Participant Name': formatParticipantName(response.participantName),
      'Participant ID': formatParticipantId(response.participantId),
      'Words Submitted': words.join(', '),
      'Word Count': words.length,
      'Submitted At': formatDate(response.createdAt)
    };
  });

  return {
    question,
    timestamp,
    slideType: 'word_cloud',
    summary: summaryRows,
    detailed: detailedRows,
    metadata: {
      totalResponses,
      uniqueWords: Object.keys(wordFrequencies).length
    }
  };
};

/**
 * Format open-ended data
 */
const formatOpenEndedData = (slide, responses, aggregatedData, question, timestamp) => {
  const detailedRows = responses.map((response, index) => {
    const answerArr = safeArray(response.answer);
    return {
      'Response #': index + 1,
      'Participant Name': formatParticipantName(response.participantName),
      'Participant ID': formatParticipantId(response.participantId),
      'Response Text': answerArr.join(' ') || 'N/A',
      'Votes': response.votes || 0,
      'Submitted At': formatDate(response.createdAt)
    };
  });

  return {
    question,
    timestamp,
    slideType: 'open_ended',
    summary: [],
    detailed: detailedRows,
    metadata: {
      totalResponses: responses.length
    }
  };
};

/**
 * Format scales data
 */
const formatScalesData = (slide, responses, aggregatedData, question, timestamp) => {
  const statements = Array.isArray(slide?.statements) ? slide.statements : [];
  const scaleDistribution = aggregatedData?.scaleDistribution || {};
  const scaleAverage = Number(aggregatedData?.scaleAverage) || 0;
  const scaleStatementAverages = Array.isArray(aggregatedData?.scaleStatementAverages) ? aggregatedData.scaleStatementAverages : [];
  const minValue = Number(slide?.minValue) || 1;
  const maxValue = Number(slide?.maxValue) || 5;
  const totalResponses = aggregatedData?.totalResponses || (Array.isArray(responses) ? responses.length : 0);

  const summaryRows = [];
  if (statements.length > 0) {
    statements.forEach((statement, index) => {
      const avg = Number(scaleStatementAverages[index]) || 0;
      summaryRows.push({
        'Statement': String(statement || ''),
        'Average Rating': avg.toFixed(2),
        'Scale Range': `${minValue} - ${maxValue}`
      });
    });
  } else {
    summaryRows.push({
      'Question': question,
      'Average Rating': scaleAverage.toFixed(2),
      'Scale Range': `${minValue} - ${maxValue}`,
      'Total Responses': totalResponses
    });
  }

  const distributionRows = Object.entries(scaleDistribution)
    .filter(([value]) => value != null)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([value, count]) => ({
      'Rating Value': String(value),
      'Count': Number(count) || 0,
      'Percentage': formatPercentage(count || 0, totalResponses)
    }));

  const detailedRows = responses.map((response, index) => {
    const ratings = safeArray(response.answer);
    const ratingText = statements.length > 0
      ? statements.map((stmt, idx) => `${stmt}: ${ratings[idx] != null ? ratings[idx] : 'N/A'}`).join('; ')
      : (ratings[0] != null ? String(ratings[0]) : 'N/A');
    
    return {
      'Response #': index + 1,
      'Participant Name': formatParticipantName(response.participantName),
      'Participant ID': formatParticipantId(response.participantId),
      'Ratings': ratingText,
      'Submitted At': formatDate(response.createdAt)
    };
  });

  return {
    question,
    timestamp,
    slideType: 'scales',
    summary: [...summaryRows, ...distributionRows],
    detailed: detailedRows,
    metadata: {
      totalResponses,
      averageRating: scaleAverage
    }
  };
};

/**
 * Format ranking data
 */
const formatRankingData = (slide, responses, aggregatedData, question, timestamp) => {
  const rankingResults = Array.isArray(aggregatedData?.rankingResults) ? aggregatedData.rankingResults : [];
  const totalResponses = aggregatedData?.totalResponses || (Array.isArray(responses) ? responses.length : 0);

  const summaryRows = rankingResults.map((result, index) => ({
    'Rank': index + 1,
    'Item': result?.label || result?.itemId || 'N/A',
    'Average Position': result?.averageRank != null ? Number(result.averageRank).toFixed(2) : 'N/A',
    'Score': Number(result?.score) || 0,
    'Response Count': Number(result?.responseCount) || 0
  }));

  const detailedRows = responses.map((response, index) => {
    const ranking = safeArray(response.answer).filter(r => r != null);
    return {
      'Response #': index + 1,
      'Participant Name': formatParticipantName(response.participantName),
      'Participant ID': formatParticipantId(response.participantId),
      'Ranking': ranking.join(' → ') || 'N/A',
      'Submitted At': formatDate(response.createdAt)
    };
  });

  return {
    question,
    timestamp,
    slideType: 'ranking',
    summary: summaryRows,
    detailed: detailedRows,
    metadata: {
      totalResponses
    }
  };
};

/**
 * Format hundred points data
 */
const formatHundredPointsData = (slide, responses, aggregatedData, question, timestamp) => {
  const hundredPointsResults = Array.isArray(aggregatedData?.hundredPointsResults) ? aggregatedData.hundredPointsResults : [];
  const totalResponses = aggregatedData?.totalResponses || (Array.isArray(responses) ? responses.length : 0);

  const summaryRows = hundredPointsResults.map((result) => ({
    'Item': result?.label || result?.itemId || 'N/A',
    'Total Points': Number(result?.totalPoints) || 0,
    'Average Points': result?.averagePoints != null ? Number(result.averagePoints).toFixed(1) : '0.0',
    'Participants': Number(result?.participantCount) || 0
  }));

  const detailedRows = responses.map((response, index) => {
    const allocations = safeArray(response.answer).filter(a => a && typeof a === 'object');
    const allocationText = allocations.map(a => `${a.item || 'N/A'}: ${a.points || 0}pts`).join('; ') || 'N/A';
    const total = allocations.reduce((sum, a) => sum + (Number(a.points) || 0), 0);
    
    return {
      'Response #': index + 1,
      'Participant Name': formatParticipantName(response.participantName),
      'Participant ID': formatParticipantId(response.participantId),
      'Allocations': allocationText,
      'Total Points': total,
      'Submitted At': formatDate(response.createdAt)
    };
  });

  return {
    question,
    timestamp,
    slideType: 'hundred_points',
    summary: summaryRows,
    detailed: detailedRows,
    metadata: {
      totalResponses
    }
  };
};

/**
 * Format grid data
 */
const formatGridData = (slide, responses, aggregatedData, question, timestamp) => {
  const gridResults = Array.isArray(aggregatedData?.gridResults) ? aggregatedData.gridResults : [];
  const totalResponses = aggregatedData?.totalResponses || (Array.isArray(responses) ? responses.length : 0);

  const summaryRows = gridResults.map((result) => ({
    'Item': result?.label || result?.itemId || 'N/A',
    'Average X': result?.averageX != null ? Number(result.averageX).toFixed(2) : '0.00',
    'Average Y': result?.averageY != null ? Number(result.averageY).toFixed(2) : '0.00',
    'Response Count': Number(result?.count) || 0
  }));

  const detailedRows = responses.map((response, index) => {
    const positions = safeArray(response.answer).filter(p => p && typeof p === 'object');
    const positionText = positions.map(p => `${p.item || 'N/A'}: (${p.x != null ? p.x : 'N/A'}, ${p.y != null ? p.y : 'N/A'})`).join('; ') || 'N/A';
    
    return {
      'Response #': index + 1,
      'Participant Name': formatParticipantName(response.participantName),
      'Participant ID': formatParticipantId(response.participantId),
      'Positions': positionText,
      'Submitted At': formatDate(response.createdAt)
    };
  });

  return {
    question,
    timestamp,
    slideType: '2x2_grid',
    summary: summaryRows,
    detailed: detailedRows,
    metadata: {
      totalResponses
    }
  };
};

/**
 * Format pin on image data
 */
const formatPinOnImageData = (slide, responses, aggregatedData, question, timestamp) => {
  const pinResults = Array.isArray(aggregatedData?.pinResults) ? aggregatedData.pinResults : [];
  const totalResponses = aggregatedData?.totalResponses || (Array.isArray(responses) ? responses.length : 0);

  const validPins = pinResults.filter(p => p && (p.x != null || p.y != null));
  const avgX = validPins.length > 0 
    ? (validPins.reduce((sum, p) => sum + (Number(p.x) || 0), 0) / validPins.length).toFixed(2)
    : '0.00';
  const avgY = validPins.length > 0
    ? (validPins.reduce((sum, p) => sum + (Number(p.y) || 0), 0) / validPins.length).toFixed(2)
    : '0.00';

  const summaryRows = [{
    'Total Pins': totalResponses,
    'Average X': avgX,
    'Average Y': avgY
  }];

  const detailedRows = responses.map((response, index) => {
    const pin = response.answer && typeof response.answer === 'object' ? response.answer : {};
    return {
      'Response #': index + 1,
      'Participant Name': formatParticipantName(response.participantName),
      'Participant ID': formatParticipantId(response.participantId),
      'X Coordinate': pin.x != null ? Number(pin.x).toFixed(2) : 'N/A',
      'Y Coordinate': pin.y != null ? Number(pin.y).toFixed(2) : 'N/A',
      'Submitted At': formatDate(response.createdAt)
    };
  });

  return {
    question,
    timestamp,
    slideType: 'pin_on_image',
    summary: summaryRows,
    detailed: detailedRows,
    metadata: {
      totalResponses
    }
  };
};

/**
 * Format guess number data
 */
const formatGuessNumberData = (slide, responses, aggregatedData, question, timestamp) => {
  const distribution = aggregatedData?.guessNumberState?.distribution || aggregatedData?.guessDistribution || {};
  const correctAnswer = slide?.guessNumberSettings?.correctAnswer;
  const minValue = Number(slide?.guessNumberSettings?.minValue) || 1;
  const maxValue = Number(slide?.guessNumberSettings?.maxValue) || 10;
  const totalResponses = Array.isArray(responses) ? responses.length : 0;

  const summaryRows = Object.entries(distribution)
    .filter(([guess]) => guess != null)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([guess, count]) => {
      const isCorrect = correctAnswer != null && Number(guess) === Number(correctAnswer);
      return {
        'Guess': String(guess),
        'Count': Number(count) || 0,
        'Percentage': formatPercentage(count || 0, totalResponses),
        'Correct Answer': isCorrect ? 'Yes' : 'No'
      };
    });

  const detailedRows = responses.map((response, index) => {
    const guess = safeArrayFirst(response.answer);
    const isCorrect = correctAnswer != null && guess != null && Number(guess) === Number(correctAnswer);
    
    return {
      'Response #': index + 1,
      'Participant Name': formatParticipantName(response.participantName),
      'Participant ID': formatParticipantId(response.participantId),
      'Guess': guess != null ? String(guess) : 'N/A',
      'Correct': isCorrect ? 'Yes' : 'No',
      'Correct Answer': correctAnswer != null ? String(correctAnswer) : 'N/A',
      'Submitted At': formatDate(response.createdAt)
    };
  });

  return {
    question,
    timestamp,
    slideType: 'guess_number',
    summary: summaryRows,
    detailed: detailedRows,
    metadata: {
      totalResponses,
      correctAnswer,
      range: `${minValue} - ${maxValue}`
    }
  };
};

/**
 * Format quiz data
 */
const formatQuizData = (slide, responses, aggregatedData, question, timestamp) => {
  const quizState = aggregatedData?.quizState || {};
  const results = quizState?.results || {};
  const optionCounts = results?.optionCounts || aggregatedData?.voteCounts || {};
  const totalResponses = results?.totalResponses || aggregatedData?.totalResponses || (Array.isArray(responses) ? responses.length : 0);
  const correctCount = Number(results?.correctCount) || 0;
  const incorrectCount = Number(results?.incorrectCount) || 0;

  const summaryRows = Object.entries(optionCounts)
    .filter(([option]) => option != null)
    .map(([option, count]) => ({
      'Option': String(option),
      'Votes': Number(count) || 0,
      'Percentage': formatPercentage(count || 0, totalResponses)
    }));

  summaryRows.push({
    'Option': '--- Summary ---',
    'Votes': '',
    'Percentage': ''
  });

  summaryRows.push({
    'Option': 'Total Responses',
    'Votes': totalResponses,
    'Percentage': '100%'
  });

  summaryRows.push({
    'Option': 'Correct Answers',
    'Votes': correctCount,
    'Percentage': formatPercentage(correctCount, totalResponses)
  });

  summaryRows.push({
    'Option': 'Incorrect Answers',
    'Votes': incorrectCount,
    'Percentage': formatPercentage(incorrectCount, totalResponses)
  });

  const detailedRows = responses.map((response, index) => ({
    'Response #': index + 1,
    'Participant Name': formatParticipantName(response.participantName),
    'Participant ID': formatParticipantId(response.participantId),
    'Selected Option': response.answer != null ? String(response.answer) : 'N/A',
    'Correct': response.isCorrect ? 'Yes' : 'No',
    'Response Time (ms)': response.responseTime != null ? String(response.responseTime) : 'N/A',
    'Submitted At': formatDate(response.createdAt)
  }));

  return {
    question,
    timestamp,
    slideType: 'quiz',
    summary: summaryRows,
    detailed: detailedRows,
    metadata: {
      totalResponses,
      correctCount,
      incorrectCount,
      averageResponseTime: results?.averageResponseTime || 0
    }
  };
};

/**
 * Format QnA data
 */
const formatQnaData = (slide, responses, aggregatedData, question, timestamp) => {
  const questions = Array.isArray(aggregatedData?.questions) ? aggregatedData.questions : [];
  const totalResponses = questions.length;

  const summaryRows = questions.map((q, index) => ({
    'Question #': index + 1,
    'Question Text': q?.text || 'N/A',
    'Asked By': formatParticipantName(q?.participantName),
    'Answered': q?.answered ? 'Yes' : 'No',
    'Votes': Number(q?.votes || q?.voteCount) || 0,
    'Asked At': formatDate(q?.createdAt)
  }));

  return {
    question,
    timestamp,
    slideType: 'qna',
    summary: summaryRows,
    detailed: [],
    metadata: {
      totalResponses
    }
  };
};

/**
 * Format leaderboard data
 */
const formatLeaderboardData = (slide, responses, aggregatedData, question, timestamp) => {
  const leaderboard = Array.isArray(aggregatedData?.leaderboard) ? aggregatedData.leaderboard : [];
  const totalResponses = leaderboard.length;

  const summaryRows = leaderboard.map((participant, index) => ({
    'Rank': index + 1,
    'Participant Name': formatParticipantName(participant.participantName),
    'Participant ID': formatParticipantId(participant.participantId),
    'Total Score': Math.round(participant.totalScore || participant.score || 0),
    'Quizzes Played': participant.quizCount || 0
  }));

  return {
    question: question || 'Quiz Leaderboard',
    timestamp,
    slideType: 'leaderboard',
    summary: summaryRows,
    detailed: [],
    metadata: {
      totalResponses
    }
  };
};

/**
 * Format instruction slide data
 */
const formatInstructionData = (slide, responses, aggregatedData, question, timestamp) => {
  // Instruction slides may have content object or instructionContent string
  const content = slide?.content || {};
  const instructionContent = slide?.instructionContent || '';
  const website = content.website || 'www.inavora.com';
  const description = content.description || instructionContent || 'Join via website or scan QR code';
  const accessCode = aggregatedData?.accessCode || '';

  const summaryRows = [
    {
      'Type': 'Instruction Slide',
      'Content': 'Join Instructions',
      'Website': website,
      'Description': description,
      'Join Presentation Code': accessCode || 'N/A'
    }
  ];

  return {
    question: question || 'Instructions',
    timestamp,
    slideType: 'instruction',
    summary: summaryRows,
    detailed: [],
    metadata: {
      totalResponses: 0,
      accessCode: accessCode
    }
  };
};

/**
 * Format generic data
 */
const formatGenericData = (slide, responses, question, timestamp) => {
  const detailedRows = responses.map((response, index) => {
    let answerStr = 'N/A';
    if (response.answer != null) {
      if (Array.isArray(response.answer)) {
        answerStr = JSON.stringify(response.answer);
      } else {
        answerStr = String(response.answer);
      }
    }
    return {
      'Response #': index + 1,
      'Participant Name': formatParticipantName(response.participantName),
      'Participant ID': formatParticipantId(response.participantId),
      'Answer': answerStr,
      'Submitted At': formatDate(response.createdAt)
    };
  });

  return {
    question,
    timestamp,
    slideType: slide?.type || 'unknown',
    summary: [],
    detailed: detailedRows,
    metadata: {
      totalResponses: responses.length
    }
  };
};

/**
 * Export to CSV
 */
export const exportToCSV = (formattedData, filename) => {
  if (!formattedData || typeof formattedData !== 'object') {
    return;
  }
  const { question = '', timestamp = '', summary = [], detailed = [], metadata = {} } = formattedData;
  
  let csvContent = `"${question}"\n`;
  csvContent += `"Exported: ${timestamp}"\n`;
  csvContent += `"Total Responses: ${metadata.totalResponses || 0}"\n\n`;
  
  if (Array.isArray(summary) && summary.length > 0 && summary[0] && typeof summary[0] === 'object') {
    csvContent += '"SUMMARY"\n';
    const summaryHeaders = Object.keys(summary[0]);
    csvContent += summaryHeaders.map(h => `"${h}"`).join(',') + '\n';
    summary.forEach(row => {
      csvContent += summaryHeaders.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(',') + '\n';
    });
    csvContent += '\n';
  }
  
  if (Array.isArray(detailed) && detailed.length > 0 && detailed[0] && typeof detailed[0] === 'object') {
    csvContent += '"DETAILED RESPONSES"\n';
    const detailedHeaders = Object.keys(detailed[0]);
    csvContent += detailedHeaders.map(h => `"${h}"`).join(',') + '\n';
    detailed.forEach(row => {
      csvContent += detailedHeaders.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(',') + '\n';
    });
  }
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename || 'export'}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export to Excel
 */
export const exportToExcel = (formattedData, filename) => {
  if (!formattedData || typeof formattedData !== 'object') {
    return;
  }
  const { question = '', timestamp = '', summary = [], detailed = [], metadata = {}, slideType = 'unknown' } = formattedData;
  
  const wb = XLSX.utils.book_new();
  
  const metadataSheet = [
    ['Question', question],
    ['Exported', timestamp],
    ['Total Responses', metadata.totalResponses || 0],
    ['Slide Type', slideType]
  ];
  const wsMetadata = XLSX.utils.aoa_to_sheet(metadataSheet);
  XLSX.utils.book_append_sheet(wb, wsMetadata, 'Metadata');
  
  if (Array.isArray(summary) && summary.length > 0) {
    const wsSummary = XLSX.utils.json_to_sheet(summary);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
  }
  
  if (Array.isArray(detailed) && detailed.length > 0) {
    const wsDetailed = XLSX.utils.json_to_sheet(detailed);
    XLSX.utils.book_append_sheet(wb, wsDetailed, 'Detailed Responses');
  }
  
  // Write file
  XLSX.writeFile(wb, `${filename || 'export'}.xlsx`);
};
