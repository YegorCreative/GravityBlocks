(function () {
  'use strict';

  function createBoardRenderer(options) {
    const canvas = options.canvas;
    const ctx = options.ctx;
    const cols = options.cols;
    const rows = options.rows;
    const blockSize = options.blockSize;
    const colors = options.colors;
    const state = options.state;

    const backgroundLayer = document.createElement('canvas');
    const backgroundCtx = backgroundLayer.getContext('2d');
    backgroundLayer.width = canvas.width;
    backgroundLayer.height = canvas.height;

    let lineFlash = 0;

    function buildBackgroundLayer() {
      if (!backgroundCtx) return;
      backgroundCtx.fillStyle = '#0f0f12';
      backgroundCtx.fillRect(0, 0, backgroundLayer.width, backgroundLayer.height);

      if (state.settings.grid) {
        backgroundCtx.strokeStyle = 'rgba(255,255,255,0.03)';
        backgroundCtx.lineWidth = 1;
        for (let x = 0; x <= cols; x++) {
          backgroundCtx.beginPath();
          backgroundCtx.moveTo(x * blockSize, 0);
          backgroundCtx.lineTo(x * blockSize, rows * blockSize);
          backgroundCtx.stroke();
        }
        for (let y = 0; y <= rows; y++) {
          backgroundCtx.beginPath();
          backgroundCtx.moveTo(0, y * blockSize);
          backgroundCtx.lineTo(cols * blockSize, y * blockSize);
          backgroundCtx.stroke();
        }
      }
    }

    function flashForLines(linesCleared) {
      lineFlash = Math.min(0.42, 0.14 * linesCleared);
    }

    function drawBlock(x, y, color, size) {
      const s = size || blockSize;

      ctx.fillStyle = color;
      ctx.fillRect(x * s, y * s, s, s);

      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.moveTo(x * s, y * s + s);
      ctx.lineTo(x * s, y * s);
      ctx.lineTo(x * s + s, y * s);
      ctx.lineTo(x * s + s - 4, y * s + 4);
      ctx.lineTo(x * s + 4, y * s + 4);
      ctx.lineTo(x * s + 4, y * s + s - 4);
      ctx.fill();

      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.moveTo(x * s, y * s + s);
      ctx.lineTo(x * s + s, y * s + s);
      ctx.lineTo(x * s + s, y * s);
      ctx.lineTo(x * s + s - 4, y * s + 4);
      ctx.lineTo(x * s + s - 4, y * s + s - 4);
      ctx.lineTo(x * s + 4, y * s + s - 4);
      ctx.fill();

      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fillRect(x * s + 4, y * s + 4, s - 8, s - 8);
    }

    function drawGhostBlock(x, y, color) {
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x * blockSize + 2, y * blockSize + 2, blockSize - 4, blockSize - 4);
      ctx.restore();
    }

    function collidesAt(x, y, shape) {
      for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
          if (!shape[row][col]) continue;
          const newX = x + col;
          const newY = y + row;
          if (newX < 0 || newX >= cols || newY >= rows) return true;
          if (newY >= 0 && state.grid[newY][newX]) return true;
        }
      }
      return false;
    }

    function ghostYFor(x, y, shape) {
      let gy = y;
      while (!collidesAt(x, gy + 1, shape)) gy++;
      return gy;
    }

    function render() {
      ctx.drawImage(backgroundLayer, 0, 0);

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (state.grid[row][col]) {
            drawBlock(col, row, colors[state.grid[row][col]]);
          }
        }
      }

      if (state.current && state.settings.ghost) {
        const shape = state.current.shape;
        const gy = ghostYFor(state.x, state.y, shape);
        for (let row = 0; row < shape.length; row++) {
          for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
              drawGhostBlock(state.x + col, gy + row, colors[state.current.type]);
            }
          }
        }
      }

      if (state.current) {
        const shape = state.current.shape;
        for (let row = 0; row < shape.length; row++) {
          for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
              drawBlock(state.x + col, state.y + row, colors[state.current.type]);
            }
          }
        }
      }

      if (!state.running) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 48px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        ctx.font = '20px "Press Start 2P"';
        ctx.fillText('Press Restart', canvas.width / 2, canvas.height / 2 + 50);
      }

      if (state.paused) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      if (lineFlash > 0) {
        ctx.fillStyle = `rgba(0, 234, 255, ${lineFlash})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        lineFlash = Math.max(0, lineFlash - 0.025);
      }
    }

    return {
      buildBackgroundLayer,
      flashForLines,
      render
    };
  }

  window.GravityBlocksBoardRenderer = {
    createBoardRenderer
  };
})();
