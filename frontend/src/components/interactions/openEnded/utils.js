export const defaultOpenEndedSettings = () => ({
  isVotingEnabled: false
});

const normalizeSettings = (settings) => {
  return {
    isVotingEnabled: Boolean(settings.isVotingEnabled)
  };
};

export const isOpenEndedSlide = (slide) => slide?.type === 'open_ended';

export const parseOpenEndedResponses = (payload) => {
  if (!payload || payload.openEndedResponses === undefined) {
    return null;
  }
  const responses = payload.openEndedResponses;
  return Array.isArray(responses) ? responses : [];
};

export const parseOpenEndedSettings = (payload) => {
  if (!payload) return null;
  const source = payload.openEndedSettings ?? payload;
  if (!source) return null;
  if (source.isVotingEnabled === undefined) return null;
  return normalizeSettings({
    isVotingEnabled: source.isVotingEnabled
  });
};

export const resolveOpenEndedSettings = (payload, { currentSettings, reset } = {}) => {
  const parsed = parseOpenEndedSettings(payload);
  if (parsed) {
    return parsed;
  }
  if (reset) {
    return defaultOpenEndedSettings();
  }
  return currentSettings ? normalizeSettings(currentSettings) : defaultOpenEndedSettings();
};

export const mergeOpenEndedState = ({
  payload,
  setResponses,
  setSettings,
  resetResponses = false,
  resetSettings = false
}) => {
  if (setResponses) {
    setResponses((prev) => {
      const parsedResponses = parseOpenEndedResponses(payload);
      if (parsedResponses !== null) {
        return parsedResponses;
      }
      if (resetResponses) {
        return [];
      }
      return prev;
    });
  }

  if (setSettings) {
    setSettings((prev) => resolveOpenEndedSettings(payload, {
      currentSettings: prev,
      reset: resetSettings
    }));
  }
};

export const initializeOpenEndedStateForSlide = ({ slide, setResponses, setSettings }) => {
  if (setResponses) {
    setResponses([]);
  }

  if (setSettings) {
    if (slide?.openEndedSettings) {
      setSettings(resolveOpenEndedSettings({ openEndedSettings: slide.openEndedSettings }, {
        reset: true
      }));
    } else {
      setSettings(defaultOpenEndedSettings());
    }
  }
};

export const emitOpenEndedSettingsUpdate = ({ socket, presentationId, slideId, settings }) => {
  if (!socket || !presentationId || !slideId || !settings) return;

  socket.emit('set-open-ended-voting', {
    presentationId,
    slideId,
    isVotingEnabled: Boolean(settings.isVotingEnabled)
  });
};
