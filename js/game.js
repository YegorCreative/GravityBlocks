/**
 * BlockFall - Tetris Game
 */
(function(){
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
    fitStage();
    window.addEventListener('resize', fitStage, { passive: true });
    window.addEventListener('orientationchange', fitStage);
    
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
  }

  // Uniform scaler: scales the fixed 500x1000 stage to fit viewport safely
  function fitStage(){
    const stage = document.getElementById('stage');
    if(!stage) return;
    const vw = window.innerWidth || document.documentElement.clientWidth || 500;
    const vh = window.innerHeight || document.documentElement.clientHeight || 1000;
    const header = document.querySelector('header');
    const controls = document.querySelector('.mobile-controls');
    const headerH = header ? Math.ceil(header.getBoundingClientRect().height) : 0;
    const controlsVisible = controls && getComputedStyle(controls).display !== 'none';
    const controlsH = controlsVisible ? Math.ceil(controls.getBoundingClientRect().height) : 0;
    const vPad = 12; // breathing room
    const availW = Math.max(200, vw - 24);
    const availH = Math.max(300, vh - headerH - controlsH - vPad*2);
    const s = Math.max(0.2, Math.min(availW/500, availH/1000));
    stage.style.transform = `scale(${s})`;
  }

  function startGame() {
    const canvas = document.getElementById('gameBoard');
    if (!canvas) {
      alert('Canvas not found!');
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      alert('Could not get canvas context!');
      return;
    }

    // Fixed canvas sizing (stable)
    const DPR = 1;
    const BLOCK_SIZE = 50;
    canvas.style.width = '500px';
    canvas.style.height = '1000px';
    canvas.width = 500;
    canvas.height = 1000;
    ctx.setTransform(1,0,0,1,0,0);

    const COLS = 10;
    const ROWS = 20;

    // Guideline-esque colors for classic look
    const COLORS = {
      I: '#00F0F0', // cyan
      O: '#F0F000', // yellow
      T: '#A000F0', // purple
      S: '#00F000', // green
      Z: '#F00000', // red
      J: '#0000F0', // blue
      L: '#F0A000'  // orange
    };

    const SHAPES = {
      I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
      O: [[1,1],[1,1]],
      T: [[0,1,0],[1,1,1],[0,0,0]],
      S: [[0,1,1],[1,1,0],[0,0,0]],
      Z: [[1,1,0],[0,1,1],[0,0,0]],
      J: [[1,0,0],[1,1,1],[0,0,0]],
      L: [[0,0,1],[1,1,1],[0,0,0]]
    };

    const TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

    const state = {
      grid: Array(ROWS).fill(null).map(() => Array(COLS).fill(0)),
      current: null,
      x: 0,
      y: 0,
      score: 0,
      lines: 0,
      level: 1,
      running: true,
      paused: false
    };

    function randomPiece() {
      const type = TYPES[Math.floor(Math.random() * TYPES.length)];
      return { type, shape: SHAPES[type] };
    }

    function spawn() {
      state.current = randomPiece();
      state.x = Math.floor((COLS - state.current.shape[0].length) / 2);
      state.y = 0;
      
      if (collides(state.x, state.y)) {
        state.running = false;
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
      let linesCleared = 0;
      for (let row = ROWS - 1; row >= 0; row--) {
        if (state.grid[row].every(cell => cell !== 0)) {
          state.grid.splice(row, 1);
          state.grid.unshift(Array(COLS).fill(0));
          linesCleared++;
          row++; // Check same row again
        }
      }
      if (linesCleared > 0) {
        state.lines += linesCleared;
        state.score += linesCleared * 100 * state.level;
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
      while (move(0, 1)) {}
      merge();
      clearLines();
      spawn();
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
        state.current.shape = oldShape;
      }
    }

    function drawBlock(x, y, color) {
      ctx.fillStyle = color;
      ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
      
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, 3);
      ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, 3, BLOCK_SIZE - 1);
    }

    // Ghost piece helpers
    function ghostYFor(x, y, shape){
      let gy = y;
      while(true){
        // Try one row down; if collides, stop at current gy
        if (collides(x, gy + 1)) break;
        gy++;
      }
      return gy;
    }
    function drawGhostBlock(x, y, color){
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = color;
      ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
      ctx.restore();
    }

    function render() {
      // Clear canvas
      ctx.fillStyle = '#0f0f12';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid
      ctx.strokeStyle = 'rgba(90,241,255,0.08)';
      ctx.lineWidth = Math.max(1, Math.floor(BLOCK_SIZE * 0.02));
      for (let x = 0; x <= COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * BLOCK_SIZE, 0);
        ctx.lineTo(x * BLOCK_SIZE, ROWS * BLOCK_SIZE);
        ctx.stroke();
      }
      for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * BLOCK_SIZE);
        ctx.lineTo(COLS * BLOCK_SIZE, y * BLOCK_SIZE);
        ctx.stroke();
      }

      // Draw placed blocks
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          if (state.grid[row][col]) {
            drawBlock(col, row, COLORS[state.grid[row][col]]);
          }
        }
      }

      // Draw ghost piece (landing preview)
      if (state.current) {
        const shape = state.current.shape;
        const gy = ghostYFor(state.x, state.y, shape);
        for (let row = 0; row < shape.length; row++) {
          for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
              const x = state.x + col;
              const y = gy + row;
              if (y >= 0) drawGhostBlock(x, y, COLORS[state.current.type]);
            }
          }
        }
      }

      // Draw current piece
      if (state.current) {
        const shape = state.current.shape;
        for (let row = 0; row < shape.length; row++) {
          for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
              const x = state.x + col;
              const y = state.y + row;
              if (y >= 0) {
                drawBlock(x, y, COLORS[state.current.type]);
              }
            }
          }
        }
      }

      // Draw game over
      if (!state.running) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      }

      // Draw pause
      if (state.paused) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }

    function updateHUD() {
      const elScore = document.getElementById('score');
      const elLines = document.getElementById('lines');
      const elLevel = document.getElementById('level');
      
      if (elScore) elScore.textContent = state.score;
      if (elLines) elLines.textContent = state.lines;
      if (elLevel) elLevel.textContent = state.level;
    }

    // Input handling
    document.addEventListener('keydown', (e) => {
      if (!state.running || state.paused) return;
      
      switch(e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          move(-1, 0);
          break;
        case 'ArrowRight':
          e.preventDefault();
          move(1, 0);
          break;
        case 'ArrowDown':
          e.preventDefault();
          drop();
          break;
        case 'ArrowUp':
          e.preventDefault();
          rotate();
          break;
        case ' ':
          e.preventDefault();
          hardDrop();
          break;
        case 'p':
        case 'P':
          state.paused = !state.paused;
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

    function addHold(btn, fn, interval=120){
      if(!btn) return;
      let t=null;
      const start=(e)=>{ e.preventDefault(); fn(); render(); if(t) clearInterval(t); t=setInterval(()=>{ fn(); render(); }, interval); };
      const stop=()=>{ if(t){ clearInterval(t); t=null; } };
      btn.addEventListener('pointerdown', start);
      window.addEventListener('pointerup', stop);
      window.addEventListener('pointercancel', stop);
      // prevent click ghost
      btn.addEventListener('click', (e)=> e.preventDefault());
    }

    addHold(btnLeft, ()=>move(-1,0));
    addHold(btnRight, ()=>move(1,0));
    addHold(btnSoft, ()=>drop());
    if (btnRotate) btnRotate.addEventListener('click', () => { rotate(); render(); });
    if (btnHard) btnHard.addEventListener('click', () => { hardDrop(); render(); });

    // Game loop
    let lastTime = 0;
    let dropCounter = 0;
    const dropInterval = 1000; // 1 second

    function gameLoop(time = 0) {
      const deltaTime = time - lastTime;
      lastTime = time;

      if (state.running && !state.paused) {
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
          drop();
          dropCounter = 0;
        }
      }

      render();
      requestAnimationFrame(gameLoop);
    }

    // Start the game
    spawn();
    updateHUD();
    gameLoop();
  }
})();
