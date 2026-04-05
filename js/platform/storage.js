(function () {
  'use strict';

  const STORAGE = {
    highScore: 'gravityBlocksHighScore',
    legacyHighScore: 'blockFallHighScore',
    settingsPrefix: 'gravityBlocksSetting:',
    legacySettingsPrefix: 'blockFallSetting:'
  };

  function getStoredBoolean(key, fallback) {
    try {
      const current = localStorage.getItem(`${STORAGE.settingsPrefix}${key}`);
      if (current !== null) return current === 'true';
      const legacy = localStorage.getItem(`${STORAGE.legacySettingsPrefix}${key}`);
      if (legacy !== null) return legacy === 'true';
      return fallback;
    } catch (_) {
      return fallback;
    }
  }

  function setStoredBoolean(key, value) {
    try {
      localStorage.setItem(`${STORAGE.settingsPrefix}${key}`, String(value));
    } catch (_) {
      // Ignore storage errors so gameplay continues.
    }
  }

  function getHighScore() {
    try {
      const value = parseInt(
        localStorage.getItem(STORAGE.highScore) || localStorage.getItem(STORAGE.legacyHighScore),
        10
      );
      return Number.isFinite(value) ? value : 0;
    } catch (_) {
      return 0;
    }
  }

  function setHighScore(value) {
    try {
      localStorage.setItem(STORAGE.highScore, String(value));
    } catch (_) {
      // Ignore storage errors so gameplay continues.
    }
  }

  window.GravityBlocksStorage = {
    getStoredBoolean,
    setStoredBoolean,
    getHighScore,
    setHighScore
  };
})();
