(function () {
  'use strict';

  function bindGameControls(options) {
    const ensureAudioContext = options.ensureAudioContext;
    const allowKeyboard = options.allowKeyboard === true;
    const getState = options.getState;
    const actions = options.actions;

    window.addEventListener('pointerdown', ensureAudioContext, { once: true });

    if (allowKeyboard) {
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
    }

    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnRotate = document.getElementById('btn-rotate');
    const btnSoft = document.getElementById('btn-soft');
    const btnHard = document.getElementById('btn-hard');
    const btnHold = document.getElementById('btn-hold');
    const btnBombMobile = document.getElementById('btn-bomb');

    function bindPointerButton(btn, fn, interval) {
      if (!btn) return;
      let t = null;
      let suppressClick = false;
      const tick = fn || (() => { });
      const delay = interval || 100;

      const start = (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        e.preventDefault();
        suppressClick = true;
        if (btn.setPointerCapture && e.pointerId !== undefined) {
          try { btn.setPointerCapture(e.pointerId); } catch (error) { /* ignore */ }
        }
        tick();
        actions.render();
        if (t) clearInterval(t);
        if (!interval) return;
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
        window.setTimeout(() => {
          suppressClick = false;
        }, 0);
      };

      btn.addEventListener('pointerdown', start);
      btn.addEventListener('pointerup', stop);
      btn.addEventListener('pointercancel', stop);
      btn.addEventListener('lostpointercapture', stop);
      btn.addEventListener('click', (e) => {
        if (suppressClick) {
          e.preventDefault();
          suppressClick = false;
          return;
        }

        if (e.detail === 0) {
          tick();
          actions.render();
        }
      });
    }

    bindPointerButton(btnLeft, () => actions.move(-1, 0), 100);
    bindPointerButton(btnRight, () => actions.move(1, 0), 100);
    bindPointerButton(btnSoft, () => actions.drop(), 100);
    bindPointerButton(btnRotate, () => actions.rotate(), 0);
    bindPointerButton(btnHard, () => actions.hardDrop(), 0);
    bindPointerButton(btnHold, () => actions.holdPiece(), 0);

    if (btnBombMobile) {
      btnBombMobile.addEventListener('click', () => actions.useBomb());
    }
  }

  window.GravityBlocksControlsUI = {
    bindGameControls
  };
})();
