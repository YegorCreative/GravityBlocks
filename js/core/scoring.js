(function () {
  'use strict';

  function createScoringCore(options) {
    const state = options.state;
    const rows = options.rows;
    const cols = options.cols;
    const onLinesCleared = options.onLinesCleared;
    const onHighScore = options.onHighScore;

    function clearLines() {
      let linesCleared = 0;
      for (let row = rows - 1; row >= 0; row--) {
        if (state.grid[row].every((cell) => cell !== 0)) {
          state.grid.splice(row, 1);
          state.grid.unshift(Array(cols).fill(0));
          linesCleared++;
          row++;
        }
      }

      if (linesCleared > 0) {
        const points = [0, 100, 300, 500, 800];
        state.score += points[linesCleared] * state.level;
        state.lines += linesCleared;

        state.power += linesCleared * 10;
        if (state.power >= 100) {
          state.power -= 100;
          state.bombs++;
        }
        if (state.power > 100) state.power = 100;

        const newLevel = Math.floor(state.lines / 10) + 1;
        if (newLevel > state.level) {
          state.level = newLevel;
          state.dropInterval = Math.max(100, 1000 - (state.level - 1) * 100);
        }

        if (typeof onLinesCleared === 'function') onLinesCleared(linesCleared);
      }

      return linesCleared;
    }

    function saveHighScore() {
      if (state.score > state.highScore) {
        state.highScore = state.score;
        if (typeof onHighScore === 'function') onHighScore(state.highScore);
      }
    }

    return {
      clearLines,
      saveHighScore
    };
  }

  window.GravityBlocksScoringCore = {
    createScoringCore
  };
})();
