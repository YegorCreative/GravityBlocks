(function () {
  'use strict';

  function createAudioSystem() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    let audioCtx = null;
    let lastMoveSfxAt = 0;

    function ensureAudioContext() {
      if (!AudioCtx) return null;
      if (!audioCtx) {
        try {
          audioCtx = new AudioCtx();
        } catch (_) {
          return null;
        }
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => { });
      }
      return audioCtx;
    }

    function haptic(pattern) {
      try {
        if (navigator.vibrate) navigator.vibrate(pattern);
      } catch (_) {
        // Ignore unsupported vibration APIs.
      }
    }

    function playTone(freq, duration, type, gainValue, when) {
      const ac = ensureAudioContext();
      if (!ac) return;

      const osc = ac.createOscillator();
      const gain = ac.createGain();
      const start = ac.currentTime + when;
      const end = start + duration;

      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);

      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(start);
      osc.stop(end + 0.02);
    }

    function playSfx(name, data) {
      switch (name) {
        case 'move': {
          const now = performance.now();
          if (now - lastMoveSfxAt < 40) return;
          lastMoveSfxAt = now;
          playTone(240, 0.03, 'square', 0.013, 0);
          break;
        }
        case 'rotate':
          playTone(520, 0.04, 'triangle', 0.018, 0);
          break;
        case 'lock':
          playTone(130, 0.06, 'square', 0.02, 0);
          break;
        case 'hardDrop':
          playTone(220, 0.04, 'square', 0.018, 0);
          playTone(110, 0.09, 'sawtooth', 0.015, 0.03);
          haptic(12);
          break;
        case 'lineClear': {
          const lines = Math.max(1, Math.min(4, Number(data) || 1));
          const seq = [440, 554, 659, 880].slice(0, lines);
          seq.forEach((freq, i) => playTone(freq, 0.07, 'triangle', 0.02, i * 0.035));
          haptic(lines >= 4 ? [16, 30, 24] : 16);
          break;
        }
        case 'hold':
          playTone(300, 0.05, 'triangle', 0.016, 0);
          break;
        case 'bomb':
          playTone(95, 0.16, 'sawtooth', 0.03, 0);
          playTone(70, 0.2, 'triangle', 0.02, 0.03);
          haptic([18, 20, 18]);
          break;
        case 'pause':
          playTone(380, 0.05, 'square', 0.015, 0);
          break;
        case 'resume':
          playTone(520, 0.05, 'square', 0.015, 0);
          break;
        case 'gameOver':
          playTone(294, 0.1, 'triangle', 0.02, 0);
          playTone(247, 0.12, 'triangle', 0.02, 0.1);
          playTone(196, 0.16, 'triangle', 0.02, 0.22);
          break;
      }
    }

    return {
      ensureAudioContext,
      playSfx
    };
  }

  window.GravityBlocksAudio = {
    createAudioSystem
  };
})();
