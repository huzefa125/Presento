const Slide = require('../../models/Slide');
const Response = require('../../models/Response');
const Logger = require('../../utils/logger');

async function handleOpenEndedSubmission({ existingResponse, presentationId, slideId, participantId, participantName, answer }) {
  if (existingResponse) {
    return {
      success: false,
      error: 'You have already submitted a response for this slide.'
    };
  }

  const response = new Response({
    presentationId,
    slideId,
    participantId,
    participantName,
    answer,
    voteCount: 0,
    voters: []
  });

  await response.save();

  return {
    success: true,
    response
  };
}

function attachOpenEndedVotingHandlers({ io, socket, buildResultsPayload }) {
  socket.on('set-open-ended-voting', async ({ presentationId, slideId, isVotingEnabled }) => {
    try {
      const slide = await Slide.findById(slideId);
      if (!slide || String(slide.presentationId) !== String(presentationId)) {
        socket.emit('error', { message: 'Slide not found' });
        return;
      }

      if (slide.type !== 'open_ended' && slide.type !== 'type_answer') {
        socket.emit('error', { message: 'Voting mode is only available for open-ended and type answer slides' });
        return;
      }

      slide.openEndedSettings = {
        isVotingEnabled: Boolean(isVotingEnabled)
      };

      await slide.save();

      const responses = await Response.find({ slideId: slide._id });
      const resultPayload = buildResultsPayload(slide, responses);

      const responseUpdate = {
        slideId: slide._id,
        ...resultPayload
      };

      io.to(`presentation-${presentationId}`).emit('response-updated', responseUpdate);
      io.to(`presenter-${presentationId}`).emit('response-updated', responseUpdate);
      io.to(`presentation-${presentationId}`).emit('open-ended-settings-updated', {
        slideId: slide._id,
        openEndedSettings: slide.openEndedSettings
      });
      io.to(`presenter-${presentationId}`).emit('open-ended-settings-updated', {
        slideId: slide._id,
        openEndedSettings: slide.openEndedSettings
      });
    } catch (error) {
      Logger.error('Set open-ended voting error', error);
      socket.emit('error', { message: 'Failed to update voting settings' });
    }
  });

  socket.on('vote-open-ended-response', async ({ presentationId, slideId, responseId, participantId }) => {
    try {
      if (!participantId) {
        socket.emit('error', { message: 'Participant identifier is required to vote' });
        return;
      }

      const slide = await Slide.findById(slideId);
      if (!slide || String(slide.presentationId) !== String(presentationId)) {
        socket.emit('error', { message: 'Slide not found' });
        return;
      }

      if (slide.type !== 'open_ended' && slide.type !== 'type_answer') {
        socket.emit('error', { message: 'Voting is only available for open-ended and type answer slides' });
        return;
      }

      const settings = slide.openEndedSettings || {};
      if (!settings.isVotingEnabled) {
        socket.emit('error', { message: 'Voting mode is not enabled for this slide yet' });
        return;
      }

      const response = await Response.findOne({ _id: responseId, slideId });
      if (!response) {
        socket.emit('error', { message: 'Response not found' });
        return;
      }

      if (Array.isArray(response.voters) && response.voters.includes(participantId)) {
        socket.emit('error', { message: 'You have already voted for this response' });
        return;
      }

      response.voteCount = (response.voteCount || 0) + 1;
      response.voters = Array.isArray(response.voters) ? response.voters : [];
      response.voters.push(participantId);
      await response.save();

      const responses = await Response.find({ slideId });
      const resultPayload = buildResultsPayload(slide, responses);

      const updatePayload = {
        slideId,
        ...resultPayload
      };

      io.to(`presentation-${presentationId}`).emit('response-updated', updatePayload);
      io.to(`presenter-${presentationId}`).emit('response-updated', updatePayload);
    } catch (error) {
      Logger.error('Vote open-ended response error', error);
      socket.emit('error', { message: 'Failed to register vote' });
    }
  });
}

module.exports = {
  handleOpenEndedSubmission,
  attachOpenEndedVotingHandlers
};
