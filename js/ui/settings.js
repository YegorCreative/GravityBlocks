(function () {
  'use strict';

  function initSettingsUI(options) {
    const storage = options.storage;
    const setOverlayVisible = options.setOverlayVisible;

    const restartBtn = document.getElementById('restartBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const closeSettingsBtn = document.getElementById('closeSettings');
    const bombBtn = document.getElementById('bombBtn');
    const speedBtn = document.getElementById('speedBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    const settingsPanel = document.getElementById('settingsPanel');
    const pauseOverlay = document.getElementById('pauseOverlay');
    const toggleGhost = document.getElementById('toggleGhost');
    const toggleSound = document.getElementById('toggleSound');
    const toggleGrid = document.getElementById('toggleGrid');

    if (toggleGhost) toggleGhost.checked = storage.getStoredBoolean('ghost', true);
    if (toggleSound) toggleSound.checked = storage.getStoredBoolean('sound', true);
    if (toggleGrid) toggleGrid.checked = storage.getStoredBoolean('grid', true);

    setOverlayVisible(pauseOverlay, false);

    if (restartBtn) restartBtn.addEventListener('click', () => {
      if (confirm('Restart game?')) {
        window.resetGame();
      }
    });

    if (pauseBtn) pauseBtn.addEventListener('click', () => window.togglePause());
    if (resumeBtn) resumeBtn.addEventListener('click', () => window.togglePause());

    if (settingsBtn) settingsBtn.addEventListener('click', () => {
      window.pauseGame(true);
      setOverlayVisible(settingsPanel, true);
    });

    if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', () => {
      setOverlayVisible(settingsPanel, false);
      window.pauseGame(false);
    });

    if (bombBtn) bombBtn.addEventListener('click', () => window.useBomb());
    if (speedBtn) speedBtn.addEventListener('click', () => window.toggleSpeed());

    if (toggleGhost) toggleGhost.addEventListener('change', () => {
      if (typeof window.setGameSetting === 'function') {
        window.setGameSetting('ghost', toggleGhost.checked);
      }
    });

    if (toggleSound) toggleSound.addEventListener('change', () => {
      if (typeof window.setGameSetting === 'function') {
        window.setGameSetting('sound', toggleSound.checked);
      }
    });

    if (toggleGrid) toggleGrid.addEventListener('change', () => {
      if (typeof window.setGameSetting === 'function') {
        window.setGameSetting('grid', toggleGrid.checked);
      }
    });
  }

  window.GravityBlocksSettingsUI = {
    initSettingsUI
  };
})();
