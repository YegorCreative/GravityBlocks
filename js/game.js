/**
 * GravityBlocks - Tetris Game
 */
(function () {
  'use strict';

  const STORAGE = {
    highScore: 'gravityBlocksHighScore',
    legacyHighScore: 'blockFallHighScore',
    settingsPrefix: 'gravityBlocksSetting:',
    legacySettingsPrefix: 'blockFallSetting:'
  };

  function getStoredBoolean(key, fallback) {
    try {
      const current = localStorage.getItem(`${STORAGE.settingsPrefix}${key}`);
      if (current !== null) return current === 'true';
      const legacy = localStorage.getItem(`${STORAGE.legacySettingsPrefix}${key}`);
      if (legacy !== null) return legacy === 'true';
      return fallback;
    } catch (_) {
      return fallback;
    }
  }

  function setStoredBoolean(key, value) {
    try {
      localStorage.setItem(`${STORAGE.settingsPrefix}${key}`, String(value));
    } catch (_) {
      // Ignore storage errors so gameplay continues.
    }
  }

  function setOverlayVisible(el, visible) {
    if (!el) return;
    el.hidden = !visible;
    el.setAttribute('aria-hidden', visible ? 'false' : 'true');
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    const introSplash = document.getElementById('introSplash');
    const playBtn = document.getElementById('playBtn');
    const fallingBlocks = document.getElementById('fallingBlocks');

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
    const toggleGhost = document.getElementById('toggleGhost');
    const toggleSound = document.getElementById('toggleSound');
    const toggleGrid = document.getElementById('toggleGrid');

    function spawnIntroBlock() {
      if (!fallingBlocks || !document.body.contains(fallingBlocks)) return;

      const piece = document.createElement('div');
      const colors = ['#00F0F0', '#F0F000', '#A000F0', '#00F000', '#F00000', '#0000F0', '#F0A000'];
      const size = 20 + Math.floor(Math.random() * 24);
      const duration = 4 + Math.random() * 5;
      const delay = Math.random() * 0.6;

      piece.className = 'block-piece';
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.top = '-80px';
      piece.style.width = `${size}px`;
      piece.style.height = `${size}px`;
      piece.style.color = colors[Math.floor(Math.random() * colors.length)];
      piece.style.background = 'currentColor';
      piece.style.animationDuration = `${duration}s`;
      piece.style.animationDelay = `${delay}s`;

      fallingBlocks.appendChild(piece);
      piece.addEventListener('animationend', () => piece.remove(), { once: true });
    }

    let introTimer = null;
    if (fallingBlocks) {
      for (let i = 0; i < 20; i++) {
        setTimeout(spawnIntroBlock, i * 120);
      }
      introTimer = setInterval(spawnIntroBlock, 260);
    }

    if (toggleGhost) toggleGhost.checked = getStoredBoolean('ghost', true);
    if (toggleSound) toggleSound.checked = getStoredBoolean('sound', true);
    if (toggleGrid) toggleGrid.checked = getStoredBoolean('grid', true);
    setOverlayVisible(pauseOverlay, false);

    let fitStageRaf = 0;
    const scheduleFitStage = () => {
      if (fitStageRaf) return;
      fitStageRaf = requestAnimationFrame(() => {
        fitStageRaf = 0;
        fitStage();
      });
    };

    scheduleFitStage();
    window.addEventListener('resize', scheduleFitStage, { passive: true });
    window.addEventListener('orientationchange', scheduleFitStage, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', scheduleFitStage, { passive: true });
      window.visualViewport.addEventListener('scroll', scheduleFitStage, { passive: true });
    }

    // Start Game Flow
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        if (introTimer) {
          clearInterval(introTimer);
          introTimer = null;
        }
        if (introSplash) {
          introSplash.style.transition = 'opacity 0.5s';
          introSplash.style.opacity = '0';
          setTimeout(() => {
            introSplash.remove();
            scheduleFitStage();
            setTimeout(scheduleFitStage, 100);
            startGame();
          }, 500);
        } else {
          scheduleFitStage();
          startGame();
        }
      });
    } else {
      scheduleFitStage();
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

  // Uniform scaler: scales the fixed 500x1000 stage to fit viewport safely
  function fitStage() {
    const stage = document.getElementById('stage');
    if (!stage) return;
    const vv = window.visualViewport;
    const vw = (vv && vv.width) || window.innerWidth || document.documentElement.clientWidth || 500;
    const vh = (vv && vv.height) || window.innerHeight || document.documentElement.clientHeight || 1000;
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
    const AudioCtx = window.AudioContext || window.webkitAudioContext;

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
    const backgroundLayer = document.createElement('canvas');
    const backgroundCtx = backgroundLayer.getContext('2d');
    backgroundLayer.width = canvas.width;
    backgroundLayer.height = canvas.height;
    const hudEls = {
      score: document.getElementById('score'),
      lines: document.getElementById('lines'),
      level: document.getElementById('level'),
      high: document.getElementById('highScore'),
      bombs: document.getElementById('bombs'),
      power: document.getElementById('powerBar'),
      bombBtn: document.getElementById('bombBtn'),
      speedBtn: document.getElementById('speedBtn')
    };

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
      highScore: parseInt(localStorage.getItem(STORAGE.highScore) || localStorage.getItem(STORAGE.legacyHighScore), 10) || 0,
      lines: 0,
      level: 1,
      power: 0, // 0 to 100
      bombs: 0,
      running: true,
      paused: false,
      dropInterval: 1000,
      speedMultiplier: 1,
      settings: {
        ghost: true,
        sound: true,
        grid: true
      }
    };

    state.settings.ghost = getStoredBoolean('ghost', true);
    state.settings.sound = getStoredBoolean('sound', true);
    state.settings.grid = getStoredBoolean('grid', true);
    buildBackgroundLayer();

    let audioCtx = null;
    let gameOverSfxPlayed = false;
    let lastMoveSfxAt = 0;
    let lineFlash = 0;
    const hudPrev = { score: null, lines: null, level: null, high: null, bombs: null };

    function buildBackgroundLayer() {
      if (!backgroundCtx) return;
      backgroundCtx.fillStyle = '#0f0f12';
      backgroundCtx.fillRect(0, 0, backgroundLayer.width, backgroundLayer.height);

      if (state.settings.grid) {
        backgroundCtx.strokeStyle = 'rgba(255,255,255,0.03)';
        backgroundCtx.lineWidth = 1;
        for (let x = 0; x <= COLS; x++) {
          backgroundCtx.beginPath();
          backgroundCtx.moveTo(x * BLOCK_SIZE, 0);
          backgroundCtx.lineTo(x * BLOCK_SIZE, ROWS * BLOCK_SIZE);
          backgroundCtx.stroke();
        }
        for (let y = 0; y <= ROWS; y++) {
          backgroundCtx.beginPath();
          backgroundCtx.moveTo(0, y * BLOCK_SIZE);
          backgroundCtx.lineTo(COLS * BLOCK_SIZE, y * BLOCK_SIZE);
          backgroundCtx.stroke();
        }
      }
    }

    function haptic(pattern) {
      try {
        if (navigator.vibrate) navigator.vibrate(pattern);
      } catch (_) {
        // Ignore unsupported vibration APIs.
      }
    }

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

    function playTone(freq, duration, type = 'square', gainValue = 0.03, when = 0) {
      if (!state.settings.sound) return;
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
      if (!state.settings.sound) return;

      switch (name) {
        case 'move': {
          const now = performance.now();
          if (now - lastMoveSfxAt < 40) return;
          lastMoveSfxAt = now;
          playTone(240, 0.03, 'square', 0.013);
          break;
        }
        case 'rotate':
          playTone(520, 0.04, 'triangle', 0.018);
          break;
        case 'lock':
          playTone(130, 0.06, 'square', 0.02);
          break;
        case 'hardDrop':
          playTone(220, 0.04, 'square', 0.018);
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
          playTone(300, 0.05, 'triangle', 0.016);
          break;
        case 'bomb':
          playTone(95, 0.16, 'sawtooth', 0.03);
          playTone(70, 0.2, 'triangle', 0.02, 0.03);
          haptic([18, 20, 18]);
          break;
        case 'pause':
          playTone(380, 0.05, 'square', 0.015);
          break;
        case 'resume':
          playTone(520, 0.05, 'square', 0.015);
          break;
        case 'gameOver':
          playTone(294, 0.1, 'triangle', 0.02);
          playTone(247, 0.12, 'triangle', 0.02, 0.1);
          playTone(196, 0.16, 'triangle', 0.02, 0.22);
          break;
      }
    }

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
      gameOverSfxPlayed = false;

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
      setOverlayVisible(overlay, state.paused);
      playSfx(state.paused ? 'pause' : 'resume');
    };
    window.pauseGame = (bool) => {
      if (!state.running) return;
      state.paused = bool;
      const overlay = document.getElementById('pauseOverlay');
      setOverlayVisible(overlay, state.paused);
      playSfx(state.paused ? 'pause' : 'resume');
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
      playSfx('bomb');
    };
    window.toggleSpeed = () => {
      state.speedMultiplier++;
      if (state.speedMultiplier > 5) state.speedMultiplier = 1;
      updateHUD();
    };
    window.setGameSetting = (key, value) => {
      if (!Object.prototype.hasOwnProperty.call(state.settings, key)) return;
      state.settings[key] = !!value;
      setStoredBoolean(key, state.settings[key]);
      if (state.settings.sound) ensureAudioContext();
      if (key === 'grid') buildBackgroundLayer();
      render();
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
        if (!gameOverSfxPlayed) {
          playSfx('gameOver');
          gameOverSfxPlayed = true;
        }
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
      playSfx('hold');
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

        lineFlash = Math.min(0.42, 0.14 * linesCleared);
        playSfx('lineClear', linesCleared);
        updateHUD();
      }
    }

    function saveHighScore() {
      if (state.score > state.highScore) {
        state.highScore = state.score;
        localStorage.setItem(STORAGE.highScore, state.highScore);
        updateHUD();
      }
    }

    function move(dx, dy) {
      const newX = state.x + dx;
      const newY = state.y + dy;

      if (!collides(newX, newY)) {
        state.x = newX;
        state.y = newY;
        if (dx !== 0) playSfx('move');
        return true;
      }
      return false;
    }

    function drop() {
      if (!move(0, 1)) {
        playSfx('lock');
        merge();
        clearLines();
        spawn();
      }
    }

    function hardDrop() {
      while (move(0, 1)) { }
      playSfx('hardDrop');
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
      if (state.current.shape !== oldShape) playSfx('rotate');
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
      // Draw cached board background (base + optional grid)
      ctx.drawImage(backgroundLayer, 0, 0);

      // Placed blocks
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          if (state.grid[row][col]) {
            drawBlock(ctx, col, row, COLORS[state.grid[row][col]]);
          }
        }
      }

      // Ghost
      if (state.current && state.settings.ghost) {
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

      if (lineFlash > 0) {
        ctx.fillStyle = `rgba(0, 234, 255, ${lineFlash})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        lineFlash = Math.max(0, lineFlash - 0.025);
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
      const setValue = (el, key, value) => {
        if (!el) return;
        if (hudPrev[key] !== value) {
          el.textContent = value;
          el.classList.remove('bump');
          void el.offsetWidth;
          el.classList.add('bump');
          hudPrev[key] = value;
        }
      };

      setValue(hudEls.score, 'score', state.score);
      setValue(hudEls.lines, 'lines', state.lines);
      setValue(hudEls.level, 'level', state.level);
      setValue(hudEls.high, 'high', state.highScore);
      setValue(hudEls.bombs, 'bombs', state.bombs);

      if (hudEls.power) hudEls.power.style.width = `${state.power}%`;
      if (hudEls.bombBtn) hudEls.bombBtn.disabled = state.bombs <= 0;
      if (hudEls.speedBtn) hudEls.speedBtn.textContent = `Speed: ${state.speedMultiplier}x`;
    }

    // Input handling
    window.addEventListener('pointerdown', ensureAudioContext, { once: true });
    document.addEventListener('keydown', (e) => {
      ensureAudioContext();
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
          setOverlayVisible(overlay, state.paused);
          playSfx(state.paused ? 'pause' : 'resume');
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
