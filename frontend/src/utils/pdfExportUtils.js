import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Color palette inspired by Mentimeter - vibrant and professional
const COLORS = {
  primary: '#4F46E5',      // Indigo
  secondary: '#10B981',    // Emerald
  accent: '#F59E0B',       // Amber
  success: '#22C55E',      // Green
  warning: '#F59E0B',      // Amber
  error: '#EF4444',        // Red
  info: '#3B82F6',         // Blue
  purple: '#8B5CF6',       // Purple
  pink: '#EC4899',         // Pink
  teal: '#14B8A6',         // Teal
  orange: '#F97316',       // Orange
  cyan: '#06B6D4',         // Cyan
  background: '#FFFFFF',
  text: '#1F2937',
  textLight: '#6B7280',
  border: '#E5E7EB',
  headerBg: '#F9FAFB',
  chartColors: [
    '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#3B82F6', '#14B8A6', '#F97316', '#06B6D4',
    '#6366F1', '#22C55E', '#FBBF24', '#F87171', '#A78BFA'
  ]
};

/**
 * Convert hex color to RGB
 */
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

/**
 * Lighten a color (for transparency effect)
 */
const lightenColor = (rgb, factor = 0.9) => {
  return {
    r: Math.min(255, Math.round(rgb.r + (255 - rgb.r) * (1 - factor))),
    g: Math.min(255, Math.round(rgb.g + (255 - rgb.g) * (1 - factor))),
    b: Math.min(255, Math.round(rgb.b + (255 - rgb.b) * (1 - factor)))
  };
};

/**
 * Create a colorful PDF export similar to Mentimeter
 */
export const exportToPDF = async (allSlideData, presentation, filename) => {
  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = margin;

  // Helper function to add a new page if needed
  const checkPageBreak = (requiredHeight) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Helper function to add colored header box
  const addHeaderBox = (text, color = COLORS.primary, icon = null) => {
    checkPageBreak(15);
    const rgb = hexToRgb(color);
    doc.setFillColor(rgb.r, rgb.g, rgb.b);
    doc.roundedRect(margin, yPosition, contentWidth, 12, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(text, margin + 5, yPosition + 8);
    yPosition += 15;
    doc.setTextColor(COLORS.text);
  };

  // Helper function to add section title
  const addSectionTitle = (text, color = COLORS.primary) => {
    checkPageBreak(10);
    const rgb = hexToRgb(color);
    doc.setDrawColor(rgb.r, rgb.g, rgb.b);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 3;
    doc.setTextColor(rgb.r, rgb.g, rgb.b);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(text, margin, yPosition);
    yPosition += 8;
    doc.setTextColor(COLORS.text);
  };

  // Helper function to add colored stat box
  const addStatBox = (label, value, color, width = 45) => {
    checkPageBreak(20);
    const rgb = hexToRgb(color);
    const lightRgb = lightenColor(rgb, 0.9); // Light background
    doc.setFillColor(lightRgb.r, lightRgb.g, lightRgb.b);
    doc.roundedRect(margin, yPosition, width, 18, 2, 2, 'F');
    doc.setDrawColor(rgb.r, rgb.g, rgb.b);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, yPosition, width, 18, 2, 2, 'S');
    
    doc.setTextColor(rgb.r, rgb.g, rgb.b);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(label, margin + 3, yPosition + 7);
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(String(value), margin + 3, yPosition + 14);
    
    doc.setTextColor(COLORS.text);
    return width + 3;
  };

  // Cover Page
  doc.setFillColor(hexToRgb(COLORS.primary).r, hexToRgb(COLORS.primary).g, hexToRgb(COLORS.primary).b);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  const titleText = presentation?.title || 'Presentation Results';
  const titleLines = doc.splitTextToSize(titleText, contentWidth);
  doc.text(titleLines, pageWidth / 2, pageHeight / 2 - 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Detailed Results Report', pageWidth / 2, pageHeight / 2 + 10, { align: 'center' });
  
  doc.setFontSize(12);
  const dateStr = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  doc.text(`Generated on ${dateStr}`, pageWidth / 2, pageHeight / 2 + 25, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`${allSlideData.length} Slide${allSlideData.length !== 1 ? 's' : ''}`, pageWidth / 2, pageHeight / 2 + 35, { align: 'center' });
  
  doc.addPage();
  yPosition = margin;

  // Overview Page
  addHeaderBox('Presentation Overview', COLORS.primary);
  yPosition += 5;

  // Overview stats
  let xPos = margin;
  xPos += addStatBox('Total Slides', allSlideData.length, COLORS.primary, 50);
  const totalResponses = allSlideData.reduce((sum, item) => sum + (item.formattedData.metadata?.totalResponses || 0), 0);
  xPos += addStatBox('Total Responses', totalResponses, COLORS.secondary, 50);
  addStatBox('Export Date', new Date().toLocaleDateString(), COLORS.accent, 50);
  yPosition += 25;

  // Slide summary table
  addSectionTitle('Slides Summary', COLORS.primary);
  yPosition += 2;

  const summaryData = allSlideData.map((item, index) => [
    index + 1,
    item.formattedData.question.substring(0, 40) + (item.formattedData.question.length > 40 ? '...' : ''),
    item.formattedData.slideType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    item.formattedData.metadata?.totalResponses || 0
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['#', 'Question', 'Type', 'Responses']],
    body: summaryData,
    theme: 'striped',
    headStyles: {
      fillColor: [79, 70, 229], // Indigo
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      textColor: [31, 41, 55],
      fontSize: 9
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    margin: { left: margin, right: margin },
    styles: {
      cellPadding: 3
    }
  });

  yPosition = doc.lastAutoTable.finalY + 10;

  // Process each slide
  allSlideData.forEach((slideItem, slideIndex) => {
    const { formattedData, slide } = slideItem;
    const slideType = formattedData.slideType;
    
    // Add new page for each slide (except first)
    if (slideIndex > 0) {
      doc.addPage();
      yPosition = margin;
    }

    // Slide header with colored background
    const slideColor = COLORS.chartColors[slideIndex % COLORS.chartColors.length];
    addHeaderBox(
      `Slide ${slideIndex + 1}: ${formattedData.question.substring(0, 60)}${formattedData.question.length > 60 ? '...' : ''}`,
      slideColor
    );
    yPosition += 5;

    // Slide metadata
    doc.setFontSize(9);
    doc.setTextColor(COLORS.textLight);
    doc.setFont('helvetica', 'normal');
    doc.text(`Type: ${slideType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Total Responses: ${formattedData.metadata?.totalResponses || 0}`, margin, yPosition);
    yPosition += 8;

    // Process based on slide type
    switch (slideType) {
      case 'multiple_choice':
      case 'pick_answer':
        renderMultipleChoicePDF(doc, formattedData, slideColor, margin, contentWidth, pageHeight, () => yPosition, (val) => { yPosition = val; });
        break;
      
      case 'word_cloud':
        renderWordCloudPDF(doc, formattedData, slideColor, margin, contentWidth, pageHeight, () => yPosition, (val) => { yPosition = val; });
        break;
      
      case 'open_ended':
      case 'type_answer':
        renderOpenEndedPDF(doc, formattedData, slideColor, margin, contentWidth, pageHeight, () => yPosition, (val) => { yPosition = val; });
        break;
      
      case 'scales':
        renderScalesPDF(doc, formattedData, slideColor, margin, contentWidth, pageHeight, () => yPosition, (val) => { yPosition = val; });
        break;
      
      case 'ranking':
        renderRankingPDF(doc, formattedData, slideColor, margin, contentWidth, pageHeight, () => yPosition, (val) => { yPosition = val; });
        break;
      
      case 'hundred_points':
        renderHundredPointsPDF(doc, formattedData, slideColor, margin, contentWidth, pageHeight, () => yPosition, (val) => { yPosition = val; });
        break;
      
      case 'quiz':
        renderQuizPDF(doc, formattedData, slideColor, margin, contentWidth, pageHeight, () => yPosition, (val) => { yPosition = val; });
        break;
      
      case 'qna':
        renderQnaPDF(doc, formattedData, slideColor, margin, contentWidth, pageHeight, () => yPosition, (val) => { yPosition = val; });
        break;
      
      case 'guess_number':
        renderGuessNumberPDF(doc, formattedData, slideColor, margin, contentWidth, pageHeight, () => yPosition, (val) => { yPosition = val; });
        break;
      
      default:
        renderGenericPDF(doc, formattedData, slideColor, margin, contentWidth, pageHeight, () => yPosition, (val) => { yPosition = val; });
    }
  });

    // Save the PDF
    doc.save(`${filename || 'presentation_results'}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
};

/**
 * Render Multiple Choice / Pick Answer results
 */
const renderMultipleChoicePDF = (doc, data, color, margin, contentWidth, pageHeight, getY, setY) => {
  let yPos = getY();
  const rgb = hexToRgb(color);
  
  // Summary section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(rgb.r, rgb.g, rgb.b);
  doc.text('Results Summary', margin, yPos);
  yPos += 8;

  if (data.summary && data.summary.length > 0) {
    // Create bar chart visualization using colored boxes
    const maxVotes = Math.max(...data.summary.map(s => s.Votes || 0));
    const barWidth = contentWidth - 20;
    const barHeight = 6;
    const spacing = 3;

    data.summary.forEach((item, index) => {
      if (yPos + 15 > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
      }

      const votes = item.Votes || 0;
      const percentage = item.Percentage || '0%';
      const barLength = maxVotes > 0 ? (votes / maxVotes) * barWidth : 0;
      const itemColor = COLORS.chartColors[index % COLORS.chartColors.length];
      const itemRgb = hexToRgb(itemColor);
      
      // Option text
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(COLORS.text);
      doc.text(item.Option.substring(0, 50), margin, yPos);

      // Percentage and votes
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(COLORS.textLight);
      doc.text(`${votes} votes (${percentage})`, margin + barWidth - 40, yPos);

      yPos += 5;

      // Background bar (light gray)
      doc.setFillColor(240, 240, 240);
      doc.roundedRect(margin, yPos, barWidth, barHeight, 1, 1, 'F');
      
      // Colored bar on top
      doc.setFillColor(itemRgb.r, itemRgb.g, itemRgb.b);
      doc.roundedRect(margin, yPos, barLength, barHeight, 1, 1, 'F');

      yPos += barHeight + spacing + 3;
    });
  }

  yPos += 5;

  // Detailed responses table
  if (data.detailed && data.detailed.length > 0) {
    if (yPos + 30 > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(rgb.r, rgb.g, rgb.b);
    doc.text('Individual Responses', margin, yPos);
    yPos += 8;

    const tableData = data.detailed.slice(0, 20).map(item => [
      item['Response #'] || '',
      item['Participant Name'] || 'Anonymous',
      item['Selected Option'] || 'N/A',
      item['Submitted At'] || 'N/A'
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Participant', 'Selected Option', 'Submitted At']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [rgb.r, rgb.g, rgb.b],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        textColor: [31, 41, 55],
        fontSize: 8
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      margin: { left: margin, right: margin },
      styles: {
        cellPadding: 2,
        overflow: 'linebreak',
        cellWidth: 'wrap'
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 50 },
        2: { cellWidth: 60 },
        3: { cellWidth: 50 }
      }
    });

    yPos = doc.lastAutoTable.finalY + 5;

    if (data.detailed.length > 20) {
      doc.setFontSize(8);
      doc.setTextColor(COLORS.textLight);
      doc.text(`... and ${data.detailed.length - 20} more responses`, margin, yPos);
      yPos += 5;
    }
  }

  setY(yPos);
};

/**
 * Render Word Cloud results
 */
const renderWordCloudPDF = (doc, data, color, margin, contentWidth, pageHeight, getY, setY) => {
  let yPos = getY();
  const rgb = hexToRgb(color);

  // Top words
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(rgb.r, rgb.g, rgb.b);
  doc.text('Top Words', margin, yPos);
  yPos += 8;

  if (data.summary && data.summary.length > 0) {
    const topWords = data.summary.slice(0, 15);
    const wordsPerRow = 3;
    const wordBoxWidth = (contentWidth - 10) / wordsPerRow;
    const wordBoxHeight = 15;
    let currentX = margin;

    topWords.forEach((word, index) => {
      if (yPos + wordBoxHeight > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
        currentX = margin;
      }

      if (index > 0 && index % wordsPerRow === 0) {
        yPos += wordBoxHeight + 3;
        currentX = margin;
      }

      const wordColor = COLORS.chartColors[index % COLORS.chartColors.length];
      const wordRgb = hexToRgb(wordColor);
      const lightWordRgb = lightenColor(wordRgb, 0.8);
      const fontSize = Math.min(12, 8 + (word.Frequency || 0) / 2);

      // Colored box
      doc.setFillColor(lightWordRgb.r, lightWordRgb.g, lightWordRgb.b);
      doc.roundedRect(currentX, yPos, wordBoxWidth - 3, wordBoxHeight, 2, 2, 'F');
      doc.setDrawColor(wordRgb.r, wordRgb.g, wordRgb.b);
      doc.setLineWidth(0.3);
      doc.roundedRect(currentX, yPos, wordBoxWidth - 3, wordBoxHeight, 2, 2, 'S');

      // Word text
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(wordRgb.r, wordRgb.g, wordRgb.b);
      doc.text(word.Word.substring(0, 15), currentX + 2, yPos + 8);

      // Frequency
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(COLORS.textLight);
      doc.text(`${word.Frequency}x`, currentX + 2, yPos + 12);

      currentX += wordBoxWidth;
    });

    yPos += wordBoxHeight + 8;
  }

  setY(yPos);
};

/**
 * Render Open Ended results
 */
const renderOpenEndedPDF = (doc, data, color, margin, contentWidth, pageHeight, getY, setY) => {
  let yPos = getY();
  const rgb = hexToRgb(color);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(rgb.r, rgb.g, rgb.b);
  doc.text('Responses', margin, yPos);
  yPos += 8;

  if (data.detailed && data.detailed.length > 0) {
    const responses = data.detailed.slice(0, 30);
    
    responses.forEach((item, index) => {
      if (yPos + 25 > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
      }

      // Response box
      const responseColor = COLORS.chartColors[index % COLORS.chartColors.length];
      const responseRgb = hexToRgb(responseColor);
      const lightResponseRgb = lightenColor(responseRgb, 0.9);
      
      doc.setFillColor(lightResponseRgb.r, lightResponseRgb.g, lightResponseRgb.b);
      doc.roundedRect(margin, yPos, contentWidth, 20, 2, 2, 'F');
      doc.setDrawColor(responseRgb.r, responseRgb.g, responseRgb.b);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, yPos, contentWidth, 20, 2, 2, 'S');

      // Participant name
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(responseRgb.r, responseRgb.g, responseRgb.b);
      doc.text(item['Participant Name'] || 'Anonymous', margin + 3, yPos + 6);

      // Response text
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(COLORS.text);
      const responseText = (item['Response Text'] || 'N/A').substring(0, 100);
      doc.text(responseText, margin + 3, yPos + 12);

      // Timestamp
      doc.setFontSize(7);
      doc.setTextColor(COLORS.textLight);
      doc.text(item['Submitted At'] || '', margin + 3, yPos + 18);

      yPos += 22;
    });

    if (data.detailed.length > 30) {
      doc.setFontSize(8);
      doc.setTextColor(COLORS.textLight);
      doc.text(`... and ${data.detailed.length - 30} more responses`, margin, yPos);
      yPos += 5;
    }
  }

  setY(yPos);
};

/**
 * Render Scales results
 */
const renderScalesPDF = (doc, data, color, margin, contentWidth, pageHeight, getY, setY) => {
  let yPos = getY();
  const rgb = hexToRgb(color);

  // Summary
  if (data.summary && data.summary.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(rgb.r, rgb.g, rgb.b);
    doc.text('Average Ratings', margin, yPos);
    yPos += 8;

    data.summary.forEach((item, index) => {
      if (yPos + 15 > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
      }

      const avgRating = parseFloat(item['Average Rating'] || 0);
      const statement = item['Statement'] || item['Question'] || 'N/A';
      const itemColor = COLORS.chartColors[index % COLORS.chartColors.length];
      const itemRgb = hexToRgb(itemColor);

      // Statement
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(COLORS.text);
      doc.text(statement.substring(0, 70), margin, yPos);

      // Rating bar
      const barWidth = contentWidth - 20;
      const barHeight = 8;
      const maxRating = 5;
      const barLength = (avgRating / maxRating) * barWidth;

      doc.setFillColor(itemRgb.r, itemRgb.g, itemRgb.b);
      doc.roundedRect(margin, yPos + 3, barLength, barHeight, 1, 1, 'F');
      
      doc.setFillColor(240, 240, 240);
      doc.roundedRect(margin + barLength, yPos + 3, barWidth - barLength, barHeight, 1, 1, 'F');

      // Rating value
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(itemRgb.r, itemRgb.g, itemRgb.b);
      doc.text(avgRating.toFixed(2), margin + barWidth - 15, yPos + 8);

      yPos += 15;
    });
  }

  setY(yPos);
};

/**
 * Render Ranking results
 */
const renderRankingPDF = (doc, data, color, margin, contentWidth, pageHeight, getY, setY) => {
  let yPos = getY();
  const rgb = hexToRgb(color);

  if (data.summary && data.summary.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(rgb.r, rgb.g, rgb.b);
    doc.text('Ranking Results', margin, yPos);
    yPos += 8;

    const tableData = data.summary.map((item, index) => [
      item['Rank'] || index + 1,
      item['Item'] || 'N/A',
      item['Average Position'] || 'N/A',
      item['Score'] || 0
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Rank', 'Item', 'Avg Position', 'Score']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [rgb.r, rgb.g, rgb.b],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        textColor: [31, 41, 55],
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      margin: { left: margin, right: margin }
    });

    yPos = doc.lastAutoTable.finalY + 10;
  }

  setY(yPos);
};

/**
 * Render Hundred Points results
 */
const renderHundredPointsPDF = (doc, data, color, margin, contentWidth, pageHeight, getY, setY) => {
  let yPos = getY();
  const rgb = hexToRgb(color);

  if (data.summary && data.summary.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(rgb.r, rgb.g, rgb.b);
    doc.text('Points Distribution', margin, yPos);
    yPos += 8;

    const maxPoints = Math.max(...data.summary.map(s => s['Total Points'] || 0));
    const barWidth = contentWidth - 20;

    data.summary.forEach((item, index) => {
      if (yPos + 15 > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
      }

      const totalPoints = item['Total Points'] || 0;
      const avgPoints = item['Average Points'] || 0;
      const itemColor = COLORS.chartColors[index % COLORS.chartColors.length];
      const itemRgb = hexToRgb(itemColor);
      const barLength = maxPoints > 0 ? (totalPoints / maxPoints) * barWidth : 0;

      // Item name
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(COLORS.text);
      doc.text(item['Item'] || 'N/A', margin, yPos);

      // Points info
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(COLORS.textLight);
      doc.text(`Total: ${totalPoints} | Avg: ${avgPoints.toFixed(1)}`, margin + barWidth - 60, yPos);

      yPos += 5;

      // Bar
      doc.setFillColor(itemRgb.r, itemRgb.g, itemRgb.b);
      doc.roundedRect(margin, yPos, barLength, 8, 1, 1, 'F');

      yPos += 12;
    });
  }

  setY(yPos);
};

/**
 * Render Quiz results
 */
const renderQuizPDF = (doc, data, color, margin, contentWidth, pageHeight, getY, setY) => {
  let yPos = getY();
  const rgb = hexToRgb(color);

  // Stats
  const correctCount = data.metadata?.correctCount || 0;
  const incorrectCount = data.metadata?.incorrectCount || 0;
  const totalResponses = data.metadata?.totalResponses || 0;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(rgb.r, rgb.g, rgb.b);
  doc.text('Quiz Statistics', margin, yPos);
  yPos += 8;

    // Add stat boxes inline
    const addStatBoxInline = (label, value, statColor, width = 45) => {
      if (yPos + 20 > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
      }
      const statRgb = hexToRgb(statColor);
      const lightStatRgb = lightenColor(statRgb, 0.9);
      doc.setFillColor(lightStatRgb.r, lightStatRgb.g, lightStatRgb.b);
      doc.roundedRect(margin, yPos, width, 18, 2, 2, 'F');
      doc.setDrawColor(statRgb.r, statRgb.g, statRgb.b);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, yPos, width, 18, 2, 2, 'S');
    
    doc.setTextColor(statRgb.r, statRgb.g, statRgb.b);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(label, margin + 3, yPos + 7);
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(String(value), margin + 3, yPos + 14);
    
    doc.setTextColor(COLORS.text);
    return width + 3;
  };

  let xPos = margin;
  xPos += addStatBoxInline('Correct', correctCount, COLORS.success, 45);
  xPos += addStatBoxInline('Incorrect', incorrectCount, COLORS.error, 45);
  addStatBoxInline('Total', totalResponses, COLORS.info, 45);
  yPos += 25;

  // Results table
  if (data.summary && data.summary.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(rgb.r, rgb.g, rgb.b);
    doc.text('Option Results', margin, yPos);
    yPos += 8;

    const tableData = data.summary
      .filter(item => !item['Option'].includes('---'))
      .map(item => [
        item['Option'] || 'N/A',
        item['Votes'] || 0,
        item['Percentage'] || '0%'
      ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Option', 'Votes', 'Percentage']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [rgb.r, rgb.g, rgb.b],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        textColor: [31, 41, 55],
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      margin: { left: margin, right: margin }
    });

    yPos = doc.lastAutoTable.finalY + 10;
  }

  setY(yPos);
};

/**
 * Render QnA results
 */
const renderQnaPDF = (doc, data, color, margin, contentWidth, pageHeight, getY, setY) => {
  let yPos = getY();
  const rgb = hexToRgb(color);

  if (data.summary && data.summary.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(rgb.r, rgb.g, rgb.b);
    doc.text('Questions Asked', margin, yPos);
    yPos += 8;

    data.summary.forEach((item, index) => {
      if (yPos + 30 > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
      }

      const questionColor = COLORS.chartColors[index % COLORS.chartColors.length];
      const questionRgb = hexToRgb(questionColor);
      const lightQuestionRgb = lightenColor(questionRgb, 0.9);

      // Question box
      doc.setFillColor(lightQuestionRgb.r, lightQuestionRgb.g, lightQuestionRgb.b);
      doc.roundedRect(margin, yPos, contentWidth, 25, 2, 2, 'F');
      doc.setDrawColor(questionRgb.r, questionRgb.g, questionRgb.b);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, yPos, contentWidth, 25, 2, 2, 'S');

      // Question text
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(questionRgb.r, questionRgb.g, questionRgb.b);
      doc.text(`Q${index + 1}:`, margin + 3, yPos + 7);
      const questionText = (item['Question Text'] || 'N/A').substring(0, 80);
      doc.text(questionText, margin + 15, yPos + 7);

      // Metadata
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(COLORS.textLight);
      doc.text(`Asked by: ${item['Asked By'] || 'Anonymous'} | Votes: ${item['Votes'] || 0} | ${item['Answered'] === 'Yes' ? '✓ Answered' : 'Not answered'}`, margin + 3, yPos + 15);

      yPos += 28;
    });
  }

  setY(yPos);
};

/**
 * Render Guess Number results
 */
const renderGuessNumberPDF = (doc, data, color, margin, contentWidth, pageHeight, getY, setY) => {
  let yPos = getY();
  const rgb = hexToRgb(color);

  if (data.summary && data.summary.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(rgb.r, rgb.g, rgb.b);
    doc.text('Guess Distribution', margin, yPos);
    yPos += 8;

    const tableData = data.summary.map(item => [
      item['Guess'] || 'N/A',
      item['Count'] || 0,
      item['Percentage'] || '0%',
      item['Correct Answer'] === 'Yes' ? '✓' : ''
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Guess', 'Count', 'Percentage', 'Correct']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [rgb.r, rgb.g, rgb.b],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        textColor: [31, 41, 55],
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      margin: { left: margin, right: margin }
    });

    yPos = doc.lastAutoTable.finalY + 10;
  }

  setY(yPos);
};

/**
 * Render Generic results
 */
const renderGenericPDF = (doc, data, color, margin, contentWidth, pageHeight, getY, setY) => {
  let yPos = getY();
  const rgb = hexToRgb(color);

  if (data.detailed && data.detailed.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(rgb.r, rgb.g, rgb.b);
    doc.text('Responses', margin, yPos);
    yPos += 8;

    const tableData = data.detailed.slice(0, 30).map(item => [
      item['Response #'] || '',
      item['Participant Name'] || 'Anonymous',
      String(item['Answer'] || 'N/A').substring(0, 40),
      item['Submitted At'] || 'N/A'
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Participant', 'Answer', 'Submitted At']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [rgb.r, rgb.g, rgb.b],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        textColor: [31, 41, 55],
        fontSize: 8
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      margin: { left: margin, right: margin }
    });

    yPos = doc.lastAutoTable.finalY + 10;
  }

  setY(yPos);
};

