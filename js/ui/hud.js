(function () {
  'use strict';

  function createHUD() {
    const els = {
      score: document.getElementById('score'),
      lines: document.getElementById('lines'),
      level: document.getElementById('level'),
      high: document.getElementById('highScore'),
      bombs: document.getElementById('bombs'),
      power: document.getElementById('powerBar'),
      bombBtn: document.getElementById('bombBtn'),
      speedBtn: document.getElementById('speedBtn')
    };

    const prev = {
      score: null,
      lines: null,
      level: null,
      high: null,
      bombs: null
    };

    function setValue(el, key, value) {
      if (!el) return;
      if (prev[key] !== value) {
        el.textContent = value;
        el.classList.remove('bump');
        void el.offsetWidth;
        el.classList.add('bump');
        prev[key] = value;
      }
    }

    function update(state) {
      setValue(els.score, 'score', state.score);
      setValue(els.lines, 'lines', state.lines);
      setValue(els.level, 'level', state.level);
      setValue(els.high, 'high', state.highScore);
      setValue(els.bombs, 'bombs', state.bombs);

      if (els.power) els.power.style.width = `${state.power}%`;
      if (els.bombBtn) els.bombBtn.disabled = state.bombs <= 0;
      if (els.speedBtn) els.speedBtn.textContent = `Speed: ${state.speedMultiplier}x`;
    }

    return {
      update
    };
  }

  window.GravityBlocksHUD = {
    createHUD
  };
})();
