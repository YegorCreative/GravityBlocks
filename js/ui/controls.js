(function () {
  'use strict';

  function bindGameControls(options) {
    const ensureAudioContext = options.ensureAudioContext;
    const getState = options.getState;
    const actions = options.actions;

    window.addEventListener('pointerdown', ensureAudioContext, { once: true });

    document.addEventListener('keydown', (e) => {
      ensureAudioContext();
      const state = getState();
      if (!state.running || state.paused) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          actions.move(-1, 0);
          break;
        case 'ArrowRight':
          e.preventDefault();
          actions.move(1, 0);
          break;
        case 'ArrowDown':
          e.preventDefault();
          actions.drop();
          break;
        case 'ArrowUp':
          e.preventDefault();
          actions.rotate();
          break;
        case ' ':
          e.preventDefault();
          actions.hardDrop();
          break;
        case 'c':
        case 'C':
        case 'Shift':
          e.preventDefault();
          actions.holdPiece();
          break;
        case 'p':
        case 'P':
          actions.togglePause();
          break;
      }

      actions.render();
    });

    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnRotate = document.getElementById('btn-rotate');
    const btnSoft = document.getElementById('btn-soft');
    const btnHard = document.getElementById('btn-hard');
    const btnBombMobile = document.getElementById('btn-bomb');

    function addHold(btn, fn, interval) {
      if (!btn) return;
      let t = null;
      const tick = fn || (() => { });
      const delay = interval || 100;

      const start = (e) => {
        e.preventDefault();
        tick();
        actions.render();
        if (t) clearInterval(t);
        t = setInterval(() => {
          tick();
          actions.render();
        }, delay);
      };

      const stop = () => {
        if (t) {
          clearInterval(t);
          t = null;
        }
      };

      btn.addEventListener('pointerdown', start);
      window.addEventListener('pointerup', stop);
      window.addEventListener('pointercancel', stop);
      btn.addEventListener('click', (e) => e.preventDefault());
    }

    addHold(btnLeft, () => actions.move(-1, 0), 100);
    addHold(btnRight, () => actions.move(1, 0), 100);
    addHold(btnSoft, () => actions.drop(), 100);

    if (btnRotate) btnRotate.addEventListener('click', () => {
      actions.rotate();
      actions.render();
    });

    if (btnHard) btnHard.addEventListener('click', () => {
      actions.hardDrop();
      actions.render();
    });

    if (btnBombMobile) btnBombMobile.addEventListener('click', () => actions.useBomb());
  }

  window.GravityBlocksControlsUI = {
    bindGameControls
  };
})();
