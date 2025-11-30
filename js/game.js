/**
 * BlockFall - Tetris Game
 */
(function () {
  'use strict';

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    const introSplash = document.getElementById('introSplash');
    const playBtn = document.getElementById('playBtn');

    // UI Buttons
    const restartBtn = document.getElementById('restartBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const closeSettingsBtn = document.getElementById('closeSettings');
    const bombBtn = document.getElementById('bombBtn');
    const speedBtn = document.getElementById('speedBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    const settingsPanel = document.getElementById('settingsPanel');
    const pauseOverlay = document.getElementById('pauseOverlay');

    fitStage();
    window.addEventListener('resize', fitStage, { passive: true });
    window.addEventListener('orientationchange', fitStage);

    // Start Game Flow
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        if (introSplash) {
          introSplash.style.transition = 'opacity 0.5s';
          introSplash.style.opacity = '0';
          setTimeout(() => {
            introSplash.remove();
            fitStage();
            setTimeout(fitStage, 100);
            startGame();
          }, 500);
        } else {
          fitStage();
          startGame();
        }
      });
    } else {
      fitStage();
      startGame();
    }

    // Global UI Event Listeners (assigned once)
    if (restartBtn) restartBtn.addEventListener('click', () => {
      if (confirm('Restart game?')) {
        window.resetGame();
      }
    });

    if (pauseBtn) pauseBtn.addEventListener('click', () => window.togglePause());
    if (resumeBtn) resumeBtn.addEventListener('click', () => window.togglePause());

    if (settingsBtn) settingsBtn.addEventListener('click', () => {
      window.pauseGame(true);
      if (settingsPanel) settingsPanel.hidden = false;
    });

    if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', () => {
      if (settingsPanel) settingsPanel.hidden = true;
      window.pauseGame(false);
    });

    if (bombBtn) bombBtn.addEventListener('click', () => window.useBomb());

    if (speedBtn) speedBtn.addEventListener('click', () => window.toggleSpeed());
  }

  // Uniform scaler: scales the fixed 500x1000 stage to fit viewport safely
  function fitStage() {
    const stage = document.getElementById('stage');
    if (!stage) return;
    const vw = window.innerWidth || document.documentElement.clientWidth || 500;
    const vh = window.innerHeight || document.documentElement.clientHeight || 1000;
    const header = document.querySelector('header');
    const controls = document.querySelector('.mobile-controls');
    const headerH = header ? Math.ceil(header.getBoundingClientRect().height) : 0;
    const controlsVisible = controls && getComputedStyle(controls).display !== 'none';
    const controlsH = controlsVisible ? Math.ceil(controls.getBoundingClientRect().height) : 0;
    const vPad = 12; // breathing room
    const availW = Math.max(200, vw - 24);
    const availH = Math.max(300, vh - headerH - controlsH - vPad * 2);
    const s = Math.max(0.2, Math.min(availW / 500, availH / 1000));
    stage.style.transform = `scale(${s})`;
  }

  function startGame() {
    const canvas = document.getElementById('gameBoard');
    const holdCanvas = document.getElementById('holdCanvas');
    const nextQueueDiv = document.getElementById('nextQueue');

    if (!canvas) {
      console.error('Canvas not found!');
      return;
    }

    const ctx = canvas.getContext('2d');
    const holdCtx = holdCanvas ? holdCanvas.getContext('2d') : null;

    // Fixed canvas sizing (stable)
    const BLOCK_SIZE = 50;
    canvas.width = 500;
    canvas.height = 1000;

    if (holdCanvas) {
      holdCanvas.width = 100; // 4 blocks * 25 (scaled down)
      holdCanvas.height = 100;
    }

    const COLS = 10;
    const ROWS = 20;

    // Colors
    const COLORS = {
      I: '#00F0F0', O: '#F0F000', T: '#A000F0', S: '#00F000',
      Z: '#F00000', J: '#0000F0', L: '#F0A000'
    };

    const SHAPES = {
      I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
      O: [[1, 1], [1, 1]],
      T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
      S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
      Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
      J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
      L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]]
    };

    const TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

    // Game State
    let state = {
      grid: [],
      current: null,
      hold: null,
      canHold: true,
      nextQueue: [],
      x: 0,
      y: 0,
      score: 0,
      highScore: parseInt(localStorage.getItem('blockFallHighScore')) || 0,
      lines: 0,
      level: 1,
      power: 0, // 0 to 100
      bombs: 0,
      running: true,
      paused: false,
      dropInterval: 1000,
      speedMultiplier: 1
    };

    // --- Core Logic ---

    function reset() {
      state.grid = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
      state.hold = null;
      state.canHold = true;
      state.nextQueue = [];
      state.score = 0;
      state.lines = 0;
      state.level = 1;
      state.power = 0;
      state.bombs = 0;
      state.running = true;
      state.paused = false;
      state.dropInterval = 1000;
      state.speedMultiplier = 1;

      // Fill next queue
      for (let i = 0; i < 3; i++) state.nextQueue.push(randomPiece());

      spawn();
      updateHUD();
    }

    // Expose reset to window for button
    window.resetGame = reset;
    window.togglePause = () => {
      if (!state.running) return;
      state.paused = !state.paused;
      const overlay = document.getElementById('pauseOverlay');
      if (overlay) overlay.hidden = !state.paused;
    };
    window.pauseGame = (bool) => {
      if (!state.running) return;
      state.paused = bool;
    };
    window.useBomb = () => {
      if (!state.running || state.paused || state.bombs <= 0) return;
      state.bombs--;
      // Bomb logic: clear bottom 2 rows
      state.grid.splice(ROWS - 2, 2);
      state.grid.unshift(Array(COLS).fill(0));
      state.grid.unshift(Array(COLS).fill(0));
      updateHUD();
      render();
    };
    window.toggleSpeed = () => {
      state.speedMultiplier++;
      if (state.speedMultiplier > 5) state.speedMultiplier = 1;
      updateHUD();
    };

    function randomPiece() {
      const type = TYPES[Math.floor(Math.random() * TYPES.length)];
      return { type, shape: SHAPES[type] };
    }

    function spawn() {
      if (state.nextQueue.length === 0) {
        state.nextQueue.push(randomPiece());
      }
      state.current = state.nextQueue.shift();
      state.nextQueue.push(randomPiece());

      state.x = Math.floor((COLS - state.current.shape[0].length) / 2);
      state.y = 0;
      state.canHold = true;

      if (collides(state.x, state.y)) {
        state.running = false;
        saveHighScore();
      }
      renderNextQueue();
    }

    function holdPiece() {
      if (!state.canHold || !state.running || state.paused) return;

      if (state.hold) {
        const temp = state.current;
        state.current = state.hold;
        state.hold = temp;
        // Reset position
        state.x = Math.floor((COLS - state.current.shape[0].length) / 2);
        state.y = 0;
      } else {
        state.hold = state.current;
        spawn();
      }

      state.canHold = false;
      renderHold();
    }

    function collides(x, y) {
      const shape = state.current.shape;
      for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
          if (shape[row][col]) {
            const newX = x + col;
            const newY = y + row;

            if (newX < 0 || newX >= COLS || newY >= ROWS) {
              return true;
            }
            if (newY >= 0 && state.grid[newY][newX]) {
              return true;
            }
          }
        }
      }
      return false;
    }

    function merge() {
      const shape = state.current.shape;
      for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
          if (shape[row][col]) {
            const newY = state.y + row;
            const newX = state.x + col;
            if (newY >= 0) {
              state.grid[newY][newX] = state.current.type;
            }
          }
        }
      }
    }

    function clearLines() {
      let linesCleared = 0;
      for (let row = ROWS - 1; row >= 0; row--) {
        if (state.grid[row].every(cell => cell !== 0)) {
          state.grid.splice(row, 1);
          state.grid.unshift(Array(COLS).fill(0));
          linesCleared++;
          row++;
        }
      }
      if (linesCleared > 0) {
        const points = [0, 100, 300, 500, 800];
        state.score += points[linesCleared] * state.level;
        state.lines += linesCleared;

        // Power meter logic
        state.power += linesCleared * 10;
        if (state.power >= 100) {
          state.power -= 100;
          state.bombs++;
        }
        if (state.power > 100) state.power = 100;

        // Level up every 10 lines
        const newLevel = Math.floor(state.lines / 10) + 1;
        if (newLevel > state.level) {
          state.level = newLevel;
          state.dropInterval = Math.max(100, 1000 - (state.level - 1) * 100);
        }

        updateHUD();
      }
    }

    function saveHighScore() {
      if (state.score > state.highScore) {
        state.highScore = state.score;
        localStorage.setItem('blockFallHighScore', state.highScore);
        updateHUD();
      }
    }

    function move(dx, dy) {
      const newX = state.x + dx;
      const newY = state.y + dy;

      if (!collides(newX, newY)) {
        state.x = newX;
        state.y = newY;
        return true;
      }
      return false;
    }

    function drop() {
      if (!move(0, 1)) {
        merge();
        clearLines();
        spawn();
      }
    }

    function hardDrop() {
      while (move(0, 1)) { }
      merge();
      clearLines();
      spawn();
      // Hard drop gives a bit of power?
      state.power = Math.min(100, state.power + 1);
      updateHUD();
    }

    function rotate() {
      const shape = state.current.shape;
      const n = shape.length;
      const rotated = Array(n).fill(null).map(() => Array(n).fill(0));

      for (let row = 0; row < n; row++) {
        for (let col = 0; col < n; col++) {
          rotated[col][n - 1 - row] = shape[row][col];
        }
      }

      const oldShape = state.current.shape;
      state.current.shape = rotated;

      if (collides(state.x, state.y)) {
        // Wall kick (basic)
        if (!collides(state.x - 1, state.y)) state.x -= 1;
        else if (!collides(state.x + 1, state.y)) state.x += 1;
        else state.current.shape = oldShape;
      }
    }

    // --- Rendering ---

    function drawBlock(ctx, x, y, color, size = BLOCK_SIZE) {
      // Main block
      ctx.fillStyle = color;
      ctx.fillRect(x * size, y * size, size, size);

      // Bevel effect (Classic Tetris style)
      // Top & Left (Light)
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.moveTo(x * size, y * size + size);
      ctx.lineTo(x * size, y * size);
      ctx.lineTo(x * size + size, y * size);
      ctx.lineTo(x * size + size - 4, y * size + 4);
      ctx.lineTo(x * size + 4, y * size + 4);
      ctx.lineTo(x * size + 4, y * size + size - 4);
      ctx.fill();

      // Bottom & Right (Dark)
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.moveTo(x * size, y * size + size);
      ctx.lineTo(x * size + size, y * size + size);
      ctx.lineTo(x * size + size, y * size);
      ctx.lineTo(x * size + size - 4, y * size + 4);
      ctx.lineTo(x * size + size - 4, y * size + size - 4);
      ctx.lineTo(x * size + 4, y * size + size - 4);
      ctx.fill();

      // Inner square
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fillRect(x * size + 4, y * size + 4, size - 8, size - 8);
    }

    function drawGhostBlock(x, y, color) {
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);
      ctx.restore();
    }

    function ghostYFor(x, y, shape) {
      let gy = y;
      while (true) {
        if (collides(x, gy + 1)) break;
        gy++;
      }
      return gy;
    }

    function render() {
      // Clear canvas
      ctx.fillStyle = '#0f0f12';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid (subtle)
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= COLS; x++) {
        ctx.beginPath(); ctx.moveTo(x * BLOCK_SIZE, 0); ctx.lineTo(x * BLOCK_SIZE, ROWS * BLOCK_SIZE); ctx.stroke();
      }
      for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath(); ctx.moveTo(0, y * BLOCK_SIZE); ctx.lineTo(COLS * BLOCK_SIZE, y * BLOCK_SIZE); ctx.stroke();
      }

      // Placed blocks
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          if (state.grid[row][col]) {
            drawBlock(ctx, col, row, COLORS[state.grid[row][col]]);
          }
        }
      }

      // Ghost
      if (state.current) {
        const shape = state.current.shape;
        const gy = ghostYFor(state.x, state.y, shape);
        for (let row = 0; row < shape.length; row++) {
          for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
              drawGhostBlock(state.x + col, gy + row, COLORS[state.current.type]);
            }
          }
        }
      }

      // Current
      if (state.current) {
        const shape = state.current.shape;
        for (let row = 0; row < shape.length; row++) {
          for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
              drawBlock(ctx, state.x + col, state.y + row, COLORS[state.current.type]);
            }
          }
        }
      }

      // Game Over
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

      // Pause
      if (state.paused) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }

    function renderHold() {
      if (!holdCtx) return;
      holdCtx.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
      if (state.hold) {
        const shape = state.hold.shape;
        const size = 20;
        const offsetX = (holdCanvas.width - shape[0].length * size) / 2;
        const offsetY = (holdCanvas.height - shape.length * size) / 2;

        for (let row = 0; row < shape.length; row++) {
          for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
              // Simplified draw for hold/next
              holdCtx.fillStyle = COLORS[state.hold.type];
              holdCtx.fillRect(offsetX + col * size, offsetY + row * size, size - 1, size - 1);
            }
          }
        }
      }
    }

    function renderNextQueue() {
      if (!nextQueueDiv) return;
      nextQueueDiv.innerHTML = '';
      state.nextQueue.forEach(piece => {
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
              // Simplified draw for hold/next
              cx.fillStyle = COLORS[piece.type];
              cx.fillRect(offsetX + col * size, offsetY + row * size, size - 1, size - 1);
            }
          }
        }
        nextQueueDiv.appendChild(c);
      });
    }

    function updateHUD() {
      const elScore = document.getElementById('score');
      const elLines = document.getElementById('lines');
      const elLevel = document.getElementById('level');
      const elHigh = document.getElementById('highScore');
      const elBombs = document.getElementById('bombs');
      const elPower = document.getElementById('powerBar');
      const btnBomb = document.getElementById('bombBtn');
      const btnSpeed = document.getElementById('speedBtn');

      if (elScore) elScore.textContent = state.score;
      if (elLines) elLines.textContent = state.lines;
      if (elLevel) elLevel.textContent = state.level;
      if (elHigh) elHigh.textContent = state.highScore;
      if (elBombs) elBombs.textContent = state.bombs;
      if (elPower) elPower.style.width = `${state.power}%`;

      if (btnBomb) btnBomb.disabled = state.bombs <= 0;
      if (btnSpeed) btnSpeed.textContent = `Speed: ${state.speedMultiplier}x`;
    }

    // Input handling
    document.addEventListener('keydown', (e) => {
      if (!state.running || state.paused) return;

      switch (e.key) {
        case 'ArrowLeft': e.preventDefault(); move(-1, 0); break;
        case 'ArrowRight': e.preventDefault(); move(1, 0); break;
        case 'ArrowDown': e.preventDefault(); drop(); break;
        case 'ArrowUp': e.preventDefault(); rotate(); break;
        case ' ': e.preventDefault(); hardDrop(); break;
        case 'c': case 'C': case 'Shift': e.preventDefault(); holdPiece(); break;
        case 'p': case 'P':
          state.paused = !state.paused;
          const overlay = document.getElementById('pauseOverlay');
          if (overlay) overlay.hidden = !state.paused;
          break;
      }
      render();
    });

    // Mobile controls
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnRotate = document.getElementById('btn-rotate');
    const btnSoft = document.getElementById('btn-soft');
    const btnHard = document.getElementById('btn-hard');
    const btnBombMobile = document.getElementById('btn-bomb');

    function addHold(btn, fn, interval = 100) {
      if (!btn) return;
      let t = null;
      const start = (e) => {
        e.preventDefault();
        fn();
        render();
        if (t) clearInterval(t);
        t = setInterval(() => { fn(); render(); }, interval);
      };
      const stop = () => { if (t) { clearInterval(t); t = null; } };
      btn.addEventListener('pointerdown', start);
      window.addEventListener('pointerup', stop);
      window.addEventListener('pointercancel', stop);
      btn.addEventListener('click', (e) => e.preventDefault());
    }

    addHold(btnLeft, () => move(-1, 0));
    addHold(btnRight, () => move(1, 0));
    addHold(btnSoft, () => drop());
    if (btnRotate) btnRotate.addEventListener('click', () => { rotate(); render(); });
    if (btnHard) btnHard.addEventListener('click', () => { hardDrop(); render(); });
    if (btnBombMobile) btnBombMobile.addEventListener('click', () => window.useBomb());

    // Game loop
    let lastTime = 0;
    let dropCounter = 0;

    function gameLoop(time = 0) {
      const deltaTime = time - lastTime;
      lastTime = time;

      if (state.running && !state.paused) {
        dropCounter += deltaTime;
        // Apply speed multiplier
        const effectiveInterval = state.dropInterval / state.speedMultiplier;

        if (dropCounter > effectiveInterval) {
          drop();
          dropCounter = 0;
        }
      }

      render();
      requestAnimationFrame(gameLoop);
    }

    // Start
    reset();
    gameLoop();
  }
})();
