const MAX_INPUT_LENGTH = 300;
const MAX_STORED_LENGTH = 50;

function normalizeAnswer(answer) {
  const raw = typeof answer === 'string' ? answer : (Array.isArray(answer) ? answer[0] : String(answer || ''));
  const trimmed = raw.trim();

  if (!trimmed) {
    throw new Error('Please enter a response');
  }

  const limited = trimmed.slice(0, MAX_INPUT_LENGTH);
  return limited.slice(0, MAX_STORED_LENGTH);
}

function buildResults(_slide, responses, context = {}) {
  const settings = context.openEndedSettings || {};

  const sorted = responses
    .map(response => ({
      id: response._id.toString(),
      text: typeof response.answer === 'string' ? response.answer : String(response.answer || ''),
      voteCount: response.voteCount || 0,
      voters: Array.isArray(response.voters) ? response.voters : [],
      submittedAt: response.submittedAt || response.createdAt || new Date(0)
    }))
    .sort((a, b) => {
      if (b.voteCount !== a.voteCount) {
        return b.voteCount - a.voteCount;
      }
      return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
    })
    .map(({ submittedAt, ...rest }) => rest);

  return {
    openEndedResponses: sorted,
    isVotingEnabled: Boolean(settings.isVotingEnabled)
  };
}

module.exports = { normalizeAnswer, buildResults };