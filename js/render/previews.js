(function () {
  'use strict';

  function createPreviewsRenderer(options) {
    const holdCanvas = options.holdCanvas;
    const holdCtx = options.holdCtx;
    const nextQueueDiv = options.nextQueueDiv;
    const colors = options.colors;

    function renderHold(state) {
      if (!holdCtx || !holdCanvas) return;
      holdCtx.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
      if (!state.hold) return;

      const shape = state.hold.shape;
      const size = 20;
      const offsetX = (holdCanvas.width - shape[0].length * size) / 2;
      const offsetY = (holdCanvas.height - shape.length * size) / 2;

      for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
          if (shape[row][col]) {
            holdCtx.fillStyle = colors[state.hold.type];
            holdCtx.fillRect(offsetX + col * size, offsetY + row * size, size - 1, size - 1);
          }
        }
      }
    }

    function renderNextQueue(state) {
      if (!nextQueueDiv) return;
      nextQueueDiv.innerHTML = '';
      state.nextQueue.forEach((piece) => {
        const c = document.createElement('canvas');
        c.width = 80;
        c.height = 60;
        const cx = c.getContext('2d');
        const shape = piece.shape;
        const size = 15;
        const offsetX = (c.width - shape[0].length * size) / 2;
        const offsetY = (c.height - shape.length * size) / 2;

        for (let row = 0; row < shape.length; row++) {
          for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
              cx.fillStyle = colors[piece.type];
              cx.fillRect(offsetX + col * size, offsetY + row * size, size - 1, size - 1);
            }
          }
        }
        nextQueueDiv.appendChild(c);
      });
    }

    return {
      renderHold,
      renderNextQueue
    };
  }

  window.GravityBlocksPreviewsRenderer = {
    createPreviewsRenderer
  };
})();
