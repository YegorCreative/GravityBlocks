(function () {
  'use strict';

  const canvas = document.getElementById('gameBoard');
  const ctx = canvas.getContext('2d');

  // DOM elements
  const elScore = document.getElementById('score');
  const elLevel = document.getElementById('level');
  const elLines = document.getElementById('lines');
  const elPowerBar = document.getElementById('powerBar');
  const elBombs = document.getElementById('bombs');
  const btnRestart = document.getElementById('restartBtn');
  const btnBomb = document.getElementById('bombBtn');
  const btnLeft = document.getElementById('btn-left');
  const btnRight = document.getElementById('btn-right');
  const btnRotate = document.getElementById('btn-rotate');
  const btnSoft = document.getElementById('btn-soft');
  const btnHard = document.getElementById('btn-hard');
  const btnMobBomb = document.getElementById('btn-bomb');

  // Read CSS color variables for blocks
  const css = getComputedStyle(document.documentElement);
  const colorVar = (name, fallback) => (css.getPropertyValue(name).trim() || fallback);
  const COLORS = {
    I: colorVar('--block-cyan', '#34e7e4'),
    O: colorVar('--block-yellow', '#ffd166'),
    T: colorVar('--block-purple', '#b084ff'),
    S: colorVar('--block-green', '#2bd36f'),
    Z: colorVar('--block-red', '#ff5a5f'),
    J: colorVar('--block-blue', '#4dabff'),
    L: colorVar('--block-orange', '#ff9f43'),
  };

  // Board size
  const COLS = 10;
  const ROWS = 20;

  // Timing / speed
  const LEVEL_LINES = 10; // lines per level
  const BASE_DROP_MS = 1000; // level 1
  const MIN_DROP_MS = 70; // cap
  const SPEED_FACTOR = 0.85; // each level faster

  // Shapes (4x4 matrices per rotation)
  const SHAPES = {
    I: [
      [
        [0,0,0,0],
        [1,1,1,1],
        [0,0,0,0],
        [0,0,0,0],
      ],
      [
        [0,0,1,0],
        [0,0,1,0],
        [0,0,1,0],
        [0,0,1,0],
      ],
      [
        [0,0,0,0],
        [0,0,0,0],
        [1,1,1,1],
        [0,0,0,0],
      ],
      [
        [0,1,0,0],
        [0,1,0,0],
        [0,1,0,0],
        [0,1,0,0],
      ],
    ],
    O: [
      [
        [0,1,1,0],
        [0,1,1,0],
        [0,0,0,0],
        [0,0,0,0],
      ],
      [
        [0,1,1,0],
        [0,1,1,0],
        [0,0,0,0],
        [0,0,0,0],
      ],
      [
        [0,1,1,0],
        [0,1,1,0],
        [0,0,0,0],
        [0,0,0,0],
      ],
      [
        [0,1,1,0],
        [0,1,1,0],
        [0,0,0,0],
        [0,0,0,0],
      ],
    ],
    T: [
      [
        [0,1,0,0],
        [1,1,1,0],
        [0,0,0,0],
        [0,0,0,0],
      ],
      [
        [0,1,0,0],
        [0,1,1,0],
        [0,1,0,0],
        [0,0,0,0],
      ],
      [
        [0,0,0,0],
        [1,1,1,0],
        [0,1,0,0],
        [0,0,0,0],
      ],
      [
        [0,1,0,0],
        [1,1,0,0],
        [0,1,0,0],
        [0,0,0,0],
      ],
    ],
    S: [
      [
        [0,1,1,0],
        [1,1,0,0],
        [0,0,0,0],
        [0,0,0,0],
      ],
      [
        [0,1,0,0],
        [0,1,1,0],
        [0,0,1,0],
        [0,0,0,0],
      ],
      [
        [0,0,0,0],
        [0,1,1,0],
        [1,1,0,0],
        [0,0,0,0],
      ],
      [
        [1,0,0,0],
        [1,1,0,0],
        [0,1,0,0],
        [0,0,0,0],
      ],
    ],
    Z: [
      [
        [1,1,0,0],
        [0,1,1,0],
        [0,0,0,0],
        [0,0,0,0],
      ],
      [
        [0,0,1,0],
        [0,1,1,0],
        [0,1,0,0],
        [0,0,0,0],
      ],
      [
        [0,0,0,0],
        [1,1,0,0],
        [0,1,1,0],
        [0,0,0,0],
      ],
      [
        [0,1,0,0],
        [1,1,0,0],
        [1,0,0,0],
        [0,0,0,0],
      ],
    ],
    J: [
      [
        [1,0,0,0],
        [1,1,1,0],
        [0,0,0,0],
        [0,0,0,0],
      ],
      [
        [0,1,1,0],
        [0,1,0,0],
        [0,1,0,0],
        [0,0,0,0],
      ],
      [
        [0,0,0,0],
        [1,1,1,0],
        [0,0,1,0],
        [0,0,0,0],
      ],
      [
        [0,1,0,0],
        [0,1,0,0],
        [1,1,0,0],
        [0,0,0,0],
      ],
    ],
    L: [
      [
        [0,0,1,0],
        [1,1,1,0],
        [0,0,0,0],
        [0,0,0,0],
      ],
      [
        [0,1,0,0],
        [0,1,0,0],
        [0,1,1,0],
        [0,0,0,0],
      ],
      [
        [0,0,0,0],
        [1,1,1,0],
        [1,0,0,0],
        [0,0,0,0],
      ],
      [
        [1,1,0,0],
        [0,1,0,0],
        [0,1,0,0],
        [0,0,0,0],
      ],
    ],
  };

  function createMatrix(cols, rows, fill = 0) {
    return Array.from({ length: rows }, () => Array(cols).fill(fill));
  }

  // 7-bag generator
  function* bagGenerator() {
    const types = Object.keys(SHAPES);
    let bag = [];
    while (true) {
      if (bag.length === 0) {
        bag = [...types];
        // shuffle
        for (let i = bag.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [bag[i], bag[j]] = [bag[j], bag[i]];
        }
      }
      yield bag.pop();
    }
  }

  const rng = bagGenerator();

  const state = {
    grid: createMatrix(COLS, ROWS, 0),
    current: null,
    nextType: rng.next().value,
    score: 0,
    lines: 0,
    level: 1,
    energy: 0, // 0..100
    bombs: 0,
    running: true,
    dropCounter: 0,
    dropInterval: BASE_DROP_MS,
  };

  function updateSpeed() {
    const lvl = Math.max(1, state.level);
    state.dropInterval = Math.max(MIN_DROP_MS, Math.floor(BASE_DROP_MS * Math.pow(SPEED_FACTOR, lvl - 1)));
  }

  function spawnPiece() {
    const type = state.nextType;
    state.nextType = rng.next().value;
    const piece = {
      type,
      rot: 0,
      x: Math.floor((COLS - 4) / 2),
      y: -1, // start slightly above
    };
    state.current = piece;
    if (collides(piece, state.grid)) {
      // Game over
      state.running = false;
    }
  }

  function getMatrixFor(piece) {
    return SHAPES[piece.type][piece.rot % 4];
  }

  function collides(piece, grid) {
    const m = getMatrixFor(piece);
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        if (!m[y][x]) continue;
        const gx = piece.x + x;
        const gy = piece.y + y;
        if (gx < 0 || gx >= COLS || gy >= ROWS) return true;
        if (gy >= 0 && grid[gy][gx]) return true;
      }
    }
    return false;
  }

  function merge(piece, grid, value) {
    const m = getMatrixFor(piece);
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        if (!m[y][x]) continue;
        const gx = piece.x + x;
        const gy = piece.y + y;
        if (gy >= 0 && gy < ROWS && gx >= 0 && gx < COLS) {
          grid[gy][gx] = value;
        }
      }
    }
  }

  function tryMove(dx, dy) {
    if (!state.running) return false;
    const p = { ...state.current };
    p.x += dx;
    p.y += dy;
    if (!collides(p, state.grid)) {
      state.current = p;
      return true;
    }
    return false;
  }

  function rotate(dir = 1) {
    if (!state.running) return;
    const original = { ...state.current };
    const p = { ...state.current, rot: (state.current.rot + (dir < 0 ? 3 : 1)) % 4 };
    // simple wall kicks: center, +1, -1, +2, -2
    const kicks = [0, 1, -1, 2, -2];
    for (const k of kicks) {
      const test = { ...p, x: p.x + k };
      if (!collides(test, state.grid)) {
        state.current = test;
        return;
      }
    }
    state.current = original; // revert
  }

  function hardDrop() {
    if (!state.running) return;
    let dropped = 0;
    while (tryMove(0, 1)) dropped++;
    lockPiece(dropped > 0);
  }

  function softDrop() {
    if (!state.running) return;
    if (!tryMove(0, 1)) {
      lockPiece(true);
    }
  }

  function lockPiece(scoredByDrop) {
    merge(state.current, state.grid, state.current.type);
    const cleared = clearLines();
    if (cleared > 0) {
      const points = scoreForLines(cleared) * state.level;
      state.score += points;
      state.lines += cleared;
      // energy for line clears
      state.energy += 20 * cleared;
      const newLevel = Math.floor(state.lines / LEVEL_LINES) + 1;
      if (newLevel !== state.level) {
        state.level = newLevel;
        updateSpeed();
      }
    }
    // energy for placing a piece
    state.energy += 5;
    // convert energy to bombs
    while (state.energy >= 100) {
      state.energy -= 100;
      state.bombs = Math.min(3, state.bombs + 1);
    }
    updateHUD();
    spawnPiece();
  }

  function clearLines() {
    let cleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
      if (state.grid[y].every(v => v)) {
        state.grid.splice(y, 1);
        state.grid.unshift(Array(COLS).fill(0));
        cleared++;
        y++; // recheck this row index after unshift
      }
    }
    return cleared;
  }

  function scoreForLines(lines) {
    switch (lines) {
      case 1: return 100;
      case 2: return 300;
      case 3: return 500;
      case 4: return 800;
      default: return 0;
    }
  }

  function updateHUD() {
    if (elScore) elScore.textContent = String(state.score);
    if (elLevel) elLevel.textContent = String(state.level);
    if (elLines) elLines.textContent = String(state.lines);
    if (btnRestart) btnRestart.disabled = state.running;
    if (elPowerBar) elPowerBar.style.width = `${Math.max(0, Math.min(100, state.energy))}%`;
    if (elBombs) elBombs.textContent = String(state.bombs);
    if (btnBomb) btnBomb.disabled = state.bombs <= 0 || !state.running;
  }

  // Rendering helpers
  let cssWidth = canvas.width, cssHeight = canvas.height;
  const DPR = Math.max(1, window.devicePixelRatio || 1);
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    cssWidth = Math.max(100, Math.floor(rect.width));
    cssHeight = Math.max(100, Math.floor(rect.height));
    const w = Math.floor(cssWidth * DPR);
    const h = Math.floor(cssHeight * DPR);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resizeCanvas();
  addEventListener('resize', resizeCanvas);

  function computeCell() {
    const size = Math.floor(Math.min(cssWidth / COLS, cssHeight / ROWS));
    const boardW = size * COLS;
    const boardH = size * ROWS;
    const offsetX = Math.floor((cssWidth - boardW) / 2);
    const offsetY = Math.floor((cssHeight - boardH) / 2);
    return { size, offsetX, offsetY, boardW, boardH };
  }

  function drawRoundedRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawCell(x, y, size, color, alpha = 1) {
    const px = x * size;
    const py = y * size;
    const r = Math.max(3, Math.floor(size * 0.18));
    ctx.save();
    ctx.globalAlpha = alpha;
    // base
    const grad = ctx.createLinearGradient(px, py, px, py + size);
    grad.addColorStop(0, lighten(color, 0.12));
    grad.addColorStop(1, darken(color, 0.16));
    ctx.fillStyle = grad;
    drawRoundedRect(px + 0.8, py + 0.8, size - 1.6, size - 1.6, r);
    ctx.fill();
    // inner highlight
    ctx.globalAlpha = alpha * 0.8;
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = Math.max(1, size * 0.06);
    ctx.stroke();
    // glow
    ctx.globalAlpha = alpha * 0.5;
    ctx.shadowColor = color;
    ctx.shadowBlur = Math.max(4, Math.floor(size * 0.4));
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  function lighten(hex, amt) {
    const { r, g, b } = hexToRgb(hex);
    return rgbToHex(
      clamp(Math.floor(r + (255 - r) * amt), 0, 255),
      clamp(Math.floor(g + (255 - g) * amt), 0, 255),
      clamp(Math.floor(b + (255 - b) * amt), 0, 255)
    );
  }
  function darken(hex, amt) {
    const { r, g, b } = hexToRgb(hex);
    return rgbToHex(
      clamp(Math.floor(r * (1 - amt)), 0, 255),
      clamp(Math.floor(g * (1 - amt)), 0, 255),
      clamp(Math.floor(b * (1 - amt)), 0, 255)
    );
  }
  function hexToRgb(hex) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(ch => ch + ch).join('');
    const num = parseInt(c, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }
  function rgbToHex(r, g, b) {
    const to = v => v.toString(16).padStart(2, '0');
    return `#${to(r)}${to(g)}${to(b)}`;
  }
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  function draw() {
    const { size, offsetX, offsetY } = computeCell();
    ctx.clearRect(0, 0, cssWidth, cssHeight);
    // subtle background grid
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = '#5af1ff';
    ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * size + 0.5, 0);
      ctx.lineTo(x * size + 0.5, ROWS * size);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * size + 0.5);
      ctx.lineTo(COLS * size, y * size + 0.5);
      ctx.stroke();
    }
    ctx.restore();

    // draw board cells
    ctx.save();
    ctx.translate(offsetX, offsetY);
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const v = state.grid[y][x];
        if (v) drawCell(x, y, size, COLORS[v]);
      }
    }

    // ghost piece
    if (state.current && state.running) {
      const ghost = { ...state.current };
      while (!collides({ ...ghost, y: ghost.y + 1 }, state.grid)) ghost.y++;
      const m = getMatrixFor(ghost);
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
          if (!m[y][x]) continue;
          const gx = ghost.x + x;
          const gy = ghost.y + y;
          if (gy >= 0) drawCell(gx, gy, size, COLORS[ghost.type], 0.25);
        }
      }
    }

    // current piece
    if (state.current) {
      const m = getMatrixFor(state.current);
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
          if (!m[y][x]) continue;
          const gx = state.current.x + x;
          const gy = state.current.y + y;
          if (gy >= 0) drawCell(gx, gy, size, COLORS[state.current.type]);
        }
      }
    }
    ctx.restore();

    // game over overlay
    if (!state.running) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, cssWidth, cssHeight);
      ctx.fillStyle = '#e8edf7';
      ctx.font = 'bold 28px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over — Press Restart', cssWidth / 2, cssHeight / 2);
      ctx.restore();
    }
  }

  // Game loop
  let lastTime = 0;
  function loop(time = 0) {
    const delta = time - lastTime;
    lastTime = time;
    if (state.running) {
      state.dropCounter += delta;
      if (state.dropCounter >= state.dropInterval) {
        state.dropCounter = 0;
        if (!tryMove(0, 1)) lockPiece(true);
      }
    }
    draw();
    requestAnimationFrame(loop);
  }

  // Controls
  function onKey(e) {
    if (!state.current) return;
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code)) e.preventDefault();
    switch (e.code) {
      case 'ArrowLeft':
        tryMove(-1, 0);
        break;
      case 'ArrowRight':
        tryMove(1, 0);
        break;
      case 'ArrowDown':
        softDrop();
        break;
      case 'ArrowUp':
      case 'KeyX':
        rotate(1);
        break;
      case 'KeyZ':
        rotate(-1);
        break;
      case 'KeyB':
      case 'KeyC':
        useBomb();
        break;
      case 'Space':
        hardDrop();
        break;
      default:
        break;
    }
  }
  window.addEventListener('keydown', onKey);

  function useBomb() {
    if (!state.running || state.bombs <= 0) return;
    // pick row with most filled cells
    let bestRow = 0;
    let bestCount = -1;
    for (let y = 0; y < ROWS; y++) {
      const count = state.grid[y].reduce((a, v) => a + (v ? 1 : 0), 0);
      if (count > bestCount) { bestCount = count; bestRow = y; }
    }
    state.grid.splice(bestRow, 1);
    state.grid.unshift(Array(COLS).fill(0));
    state.bombs -= 1;
    updateHUD();
  }

  function bindButton(btn, fn, continuous = false) {
    if (!btn) return;
    let timer = null;
    const start = (e) => {
      e.preventDefault();
      fn();
      if (continuous) timer = setInterval(fn, 120);
    };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    btn.addEventListener('pointerdown', start);
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    btn.addEventListener('click', e => e.preventDefault());
  }

  bindButton(btnLeft, () => tryMove(-1, 0), true);
  bindButton(btnRight, () => tryMove(1, 0), true);
  bindButton(btnRotate, () => rotate(1), false);
  bindButton(btnSoft, () => softDrop(), true);
  bindButton(btnHard, () => hardDrop(), false);
  bindButton(btnMobBomb, () => useBomb(), false);

  if (btnRestart) {
    btnRestart.addEventListener('click', () => {
      // reset state
      state.grid = createMatrix(COLS, ROWS, 0);
      state.score = 0;
      state.lines = 0;
      state.level = 1;
      state.energy = 0;
      state.bombs = 0;
      updateSpeed();
      state.running = true;
      state.dropCounter = 0;
      updateHUD();
      spawnPiece();
    });
  }

  if (btnBomb) btnBomb.addEventListener('click', () => useBomb());

  // Init
  updateSpeed();
  updateHUD();
  spawnPiece();
  requestAnimationFrame(loop);
})();
