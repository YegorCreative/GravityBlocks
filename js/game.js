/**
 * GravityBlocks - Tetris Game
 */
(function () {
  'use strict';

  const Storage = window.GravityBlocksStorage;
  const Viewport = window.GravityBlocksViewport;
  const AudioPlatform = window.GravityBlocksAudio;
  const HUDPlatform = window.GravityBlocksHUD;
  const SettingsUIPlatform = window.GravityBlocksSettingsUI;
  const ControlsUIPlatform = window.GravityBlocksControlsUI;
  const BoardRendererPlatform = window.GravityBlocksBoardRenderer;
  const PreviewsRendererPlatform = window.GravityBlocksPreviewsRenderer;
  const PiecesCorePlatform = window.GravityBlocksPiecesCore;
  const ScoringCorePlatform = window.GravityBlocksScoringCore;

  if (!Storage || !Viewport || !AudioPlatform || !HUDPlatform || !SettingsUIPlatform || !ControlsUIPlatform || !BoardRendererPlatform || !PreviewsRendererPlatform || !PiecesCorePlatform || !ScoringCorePlatform) {
    console.error('GravityBlocks platform modules are missing.');
    return;
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

    SettingsUIPlatform.initSettingsUI({
      storage: Storage,
      setOverlayVisible
    });

    const scheduleFitStage = Viewport.bindStageAutoFit();
    scheduleFitStage();

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
    const audio = AudioPlatform.createAudioSystem();

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
    const hud = HUDPlatform.createHUD();

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
      highScore: Storage.getHighScore(),
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

    state.settings.ghost = Storage.getStoredBoolean('ghost', true);
    state.settings.sound = Storage.getStoredBoolean('sound', true);
    state.settings.grid = Storage.getStoredBoolean('grid', true);

    const boardRenderer = BoardRendererPlatform.createBoardRenderer({
      canvas,
      ctx,
      cols: COLS,
      rows: ROWS,
      blockSize: BLOCK_SIZE,
      colors: COLORS,
      state
    });

    const previewsRenderer = PreviewsRendererPlatform.createPreviewsRenderer({
      holdCanvas,
      holdCtx,
      nextQueueDiv,
      colors: COLORS
    });

    const scoringCore = ScoringCorePlatform.createScoringCore({
      state,
      rows: ROWS,
      cols: COLS,
      onLinesCleared: (linesCleared) => {
        boardRenderer.flashForLines(linesCleared);
        playSfx('lineClear', linesCleared);
        updateHUD();
      },
      onHighScore: (highScore) => {
        Storage.setHighScore(highScore);
        updateHUD();
      }
    });

    const piecesCore = PiecesCorePlatform.createPiecesCore({
      state,
      types: TYPES,
      shapes: SHAPES,
      cols: COLS,
      collides,
      onGameOver: () => {
        scoringCore.saveHighScore();
        if (!gameOverSfxPlayed) {
          playSfx('gameOver');
          gameOverSfxPlayed = true;
        }
      },
      onQueueChanged: () => previewsRenderer.renderNextQueue(state),
      onHoldChanged: () => previewsRenderer.renderHold(state)
    });

    boardRenderer.buildBackgroundLayer();

    let gameOverSfxPlayed = false;

    function playSfx(name, data) {
      if (!state.settings.sound) return;
      audio.playSfx(name, data);
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

      piecesCore.fillInitialQueue(3);
      piecesCore.spawn();
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
      Storage.setStoredBoolean(key, state.settings[key]);
      if (state.settings.sound) audio.ensureAudioContext();
      if (key === 'grid') boardRenderer.buildBackgroundLayer();
      render();
    };

    function spawn() {
      piecesCore.spawn();
    }

    function holdPiece() {
      if (piecesCore.holdPiece()) {
        playSfx('hold');
      }
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
      scoringCore.clearLines();
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

    function render() {
      boardRenderer.render();
    }

    function updateHUD() {
      hud.update(state);
    }

    ControlsUIPlatform.bindGameControls({
      ensureAudioContext: audio.ensureAudioContext,
      getState: () => state,
      actions: {
        move,
        drop,
        rotate,
        hardDrop,
        holdPiece,
        togglePause: () => window.togglePause(),
        useBomb: () => window.useBomb(),
        render
      }
    });

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
