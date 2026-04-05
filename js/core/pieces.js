(function () {
  'use strict';

  function createPiecesCore(options) {
    const state = options.state;
    const types = options.types;
    const shapes = options.shapes;
    const cols = options.cols;
    const collides = options.collides;
    const onGameOver = options.onGameOver;
    const onQueueChanged = options.onQueueChanged;
    const onHoldChanged = options.onHoldChanged;

    function randomPiece() {
      const type = types[Math.floor(Math.random() * types.length)];
      return { type, shape: shapes[type] };
    }

    function fillInitialQueue(count) {
      state.nextQueue = [];
      for (let i = 0; i < count; i++) state.nextQueue.push(randomPiece());
      if (typeof onQueueChanged === 'function') onQueueChanged();
    }

    function spawn() {
      if (state.nextQueue.length === 0) {
        state.nextQueue.push(randomPiece());
      }
      state.current = state.nextQueue.shift();
      state.nextQueue.push(randomPiece());

      state.x = Math.floor((cols - state.current.shape[0].length) / 2);
      state.y = 0;
      state.canHold = true;

      if (collides(state.x, state.y)) {
        state.running = false;
        if (typeof onGameOver === 'function') onGameOver();
      }

      if (typeof onQueueChanged === 'function') onQueueChanged();
    }

    function holdPiece() {
      if (!state.canHold || !state.running || state.paused) return false;

      if (state.hold) {
        const temp = state.current;
        state.current = state.hold;
        state.hold = temp;
        state.x = Math.floor((cols - state.current.shape[0].length) / 2);
        state.y = 0;
      } else {
        state.hold = state.current;
        spawn();
      }

      state.canHold = false;
      if (typeof onHoldChanged === 'function') onHoldChanged();
      return true;
    }

    return {
      fillInitialQueue,
      spawn,
      holdPiece
    };
  }

  window.GravityBlocksPiecesCore = {
    createPiecesCore
  };
})();
