const Logger = require('../utils/logger');

const getResults = async (slideId, Slide, Response) => {
  try {
    const slide = await Slide.findById(slideId);
    if (!slide) {
      throw new Error('Slide not found');
    }

    const responses = await Response.find({ slideId });
    
    return {
      slide,
      responses,
      stats: {
        totalResponses: responses.length,
      }
    };
  } catch (error) {
    Logger.error('Error fetching Miro results', error);
    throw error;
  }
};

const handleResponse = async (io, socket, data, Slide, Response) => {
  try {
    const { presentationId, slideId, participantId, participantName, answer } = data;
    
    // Save response to database
    const response = new Response({
      presentationId,
      slideId,
      participantId,
      participantName,
      answer,
    });
    
    await response.save();
    
    // Emit response update to presenter
    io.to(`presentation-${presentationId}`).emit('response-updated', {
      slideId,
      response: {
        id: response._id,
        participantId: response.participantId,
        participantName: response.participantName,
        answer: response.answer,
        timestamp: response.createdAt,
      }
    });
    
    return { success: true };
  } catch (error) {
    Logger.error('Error handling Miro response', error);
    throw error;
  }
};

function normalizeAnswer(answer) {
  // For Miro slides, we just store the answer as-is
  return answer;
}

function buildResults(slide, responses) {
  return {
    totalResponses: responses.length
  };
}

module.exports = {
  getResults,
  handleResponse,
  normalizeAnswer,
  buildResults
};