/**
 * BlockFall Advanced Engine (clean build)
 */
(function(){
  'use strict';

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    initIntroScreen();
  }

  // Intro Screen Animation
  function initIntroScreen() {
    const introSplash = document.getElementById('introSplash');
    const playBtn = document.getElementById('playBtn');
    const fallingBlocks = document.getElementById('fallingBlocks');
    
    if (!introSplash || !playBtn) {
      // If intro elements missing, start game immediately
      startGame();
      return;
    }

    // Create falling blocks animation
    const colors = ['#34e7e4', '#ffd166', '#b084ff', '#2bd36f', '#ff5a5f', '#4dabff', '#ff9f43'];
    const blockCount = 20;
    
    for (let i = 0; i < blockCount; i++) {
      setTimeout(() => {
        const block = document.createElement('div');
        block.className = 'block-piece';
        block.style.left = Math.random() * 100 + '%';
        block.style.color = colors[Math.floor(Math.random() * colors.length)];
        block.style.backgroundColor = 'currentColor';
        block.style.animationDuration = (3 + Math.random() * 4) + 's';
        block.style.animationDelay = (Math.random() * 2) + 's';
        fallingBlocks.appendChild(block);
      }, i * 200);
    }

    // Play button click handler
    playBtn.addEventListener('click', () => {
      playBtn.disabled = true;
      playBtn.style.transform = 'scale(0.95)';
      
      setTimeout(() => {
        introSplash.classList.add('hidden');
        setTimeout(() => {
          introSplash.remove();
          startGame();
        }, 800);
      }, 200);
    });
  }

  function startGame() {
    const canvas=document.getElementById('gameBoard');
    const ctx=canvas.getContext('2d');
  const elScore=document.getElementById('score');
  const elLevel=document.getElementById('level');
  const elLines=document.getElementById('lines');
  const elHigh=document.getElementById('highScore');
  const elPowerBar=document.getElementById('powerBar');
  const elBombs=document.getElementById('bombs');
  const holdCanvas=document.getElementById('holdCanvas');
  const nextQueueEl=document.getElementById('nextQueue');
  const pauseOverlay=document.getElementById('pauseOverlay');
  const settingsPanel=document.getElementById('settingsPanel');
  const btnRestart=document.getElementById('restartBtn');
  const btnBomb=document.getElementById('bombBtn');
  const btnLeft=document.getElementById('btn-left');
  const btnRight=document.getElementById('btn-right');
  const btnRotate=document.getElementById('btn-rotate');
  const btnSoft=document.getElementById('btn-soft');
  const btnHard=document.getElementById('btn-hard');
  const btnMobBomb=document.getElementById('btn-bomb');
  const btnPause=document.getElementById('pauseBtn');
  const resumeBtn=document.getElementById('resumeBtn');
  const btnSettings=document.getElementById('settingsBtn');
  const closeSettingsBtn=document.getElementById('closeSettings');
  const chkGhost=document.getElementById('toggleGhost');
  const chkSound=document.getElementById('toggleSound');
  const chkGrid=document.getElementById('toggleGrid');

  const COLS=10, ROWS=20;
  const LEVEL_LINES=10, BASE_DROP_MS=1000, MIN_DROP_MS=70, SPEED_FACTOR=0.85;
  const LOCK_DELAY_MS=500, DAS_MS=150, ARR_MS=40;

  const css=getComputedStyle(document.documentElement);
  const cv=(n,f)=>css.getPropertyValue(n).trim()||f;
  const COLORS={I:cv('--block-cyan','#34e7e4'),O:cv('--block-yellow','#ffd166'),T:cv('--block-purple','#b084ff'),S:cv('--block-green','#2bd36f'),Z:cv('--block-red','#ff5a5f'),J:cv('--block-blue','#4dabff'),L:cv('--block-orange','#ff9f43')};

  const SHAPES={
    I:[[ [0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0] ],[ [0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0] ],[ [0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0] ],[ [0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0] ]],
    O:[[ [0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0] ],[ [0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0] ],[ [0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0] ],[ [0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0] ]],
    T:[[ [0,1,0,0],[1,1,1,0],[0,0,0,0],[0,0,0,0] ],[ [0,1,0,0],[0,1,1,0],[0,1,0,0],[0,0,0,0] ],[ [0,0,0,0],[1,1,1,0],[0,1,0,0],[0,0,0,0] ],[ [0,1,0,0],[1,1,0,0],[0,1,0,0],[0,0,0,0] ]],
    S:[[ [0,1,1,0],[1,1,0,0],[0,0,0,0],[0,0,0,0] ],[ [0,1,0,0],[0,1,1,0],[0,0,1,0],[0,0,0,0] ],[ [0,0,0,0],[0,1,1,0],[1,1,0,0],[0,0,0,0] ],[ [1,0,0,0],[1,1,0,0],[0,1,0,0],[0,0,0,0] ]],
    Z:[[ [1,1,0,0],[0,1,1,0],[0,0,0,0],[0,0,0,0] ],[ [0,0,1,0],[0,1,1,0],[0,1,0,0],[0,0,0,0] ],[ [0,0,0,0],[1,1,0,0],[0,1,1,0],[0,0,0,0] ],[ [0,1,0,0],[1,1,0,0],[1,0,0,0],[0,0,0,0] ]],
    J:[[ [1,0,0,0],[1,1,1,0],[0,0,0,0],[0,0,0,0] ],[ [0,1,1,0],[0,1,0,0],[0,1,0,0],[0,0,0,0] ],[ [0,0,0,0],[1,1,1,0],[0,0,1,0],[0,0,0,0] ],[ [0,1,0,0],[0,1,0,0],[1,1,0,0],[0,0,0,0] ]],
    L:[[ [0,0,1,0],[1,1,1,0],[0,0,0,0],[0,0,0,0] ],[ [0,1,0,0],[0,1,0,0],[0,1,1,0],[0,0,0,0] ],[ [0,0,0,0],[1,1,1,0],[1,0,0,0],[0,0,0,0] ],[ [1,1,0,0],[0,1,0,0],[0,1,0,0],[0,0,0,0] ]]
  };

  const KICKS={
    JLSTZ:{'0>1':[[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],'1>0':[[0,0],[1,0],[1,-1],[0,2],[1,2]],'1>2':[[0,0],[1,0],[1,-1],[0,2],[1,2]],'2>1':[[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],'2>3':[[0,0],[1,0],[1,1],[0,-2],[1,-2]],'3>2':[[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],'3>0':[[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],'0>3':[[0,0],[1,0],[1,1],[0,-2],[1,-2]]},
    I:{'0>1':[[0,0],[-2,0],[1,0],[-2,-1],[1,2]],'1>0':[[0,0],[2,0],[-1,0],[2,1],[-1,-2]],'1>2':[[0,0],[-1,0],[2,0],[-1,2],[2,-1]],'2>1':[[0,0],[1,0],[-2,0],[1,-2],[-2,1]],'2>3':[[0,0],[2,0],[-1,0],[2,1],[-1,-2]],'3>2':[[0,0],[-2,0],[1,0],[-2,-1],[1,2]],'3>0':[[0,0],[1,0],[-2,0],[1,-2],[-2,1]],'0>3':[[0,0],[-1,0],[2,0],[-1,2],[2,-1]]}
  };

  const createMatrix=(c,r,f=0)=>Array.from({length:r},()=>Array(c).fill(f));
  function* bag(){ const types=Object.keys(SHAPES); let b=[]; while(true){ if(!b.length){ b=[...types]; for(let i=b.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [b[i],b[j]]=[b[j],b[i]]; } } yield b.pop(); } }
  const rng=bag();

  const state={grid:createMatrix(COLS,ROWS,0), current:null, queue:[], hold:null, canHold:true, score:0, high:Number(localStorage.getItem('bf_high')||0), lines:0, level:1, energy:0, bombs:0, running:true, paused:false, dropCounter:0, dropInterval:BASE_DROP_MS, lockTimer:0, grounded:false, dasDir:0,dasTimer:0,arrTimer:0, ghostEnabled:true, gridEnabled:true, soundEnabled:true, combo:0, backToBack:false, lastActionRotate:false, clearing:[]};
  const updateSpeed=()=> state.dropInterval=Math.max(MIN_DROP_MS,Math.floor(BASE_DROP_MS*Math.pow(SPEED_FACTOR,state.level-1)));

  function fillQueue(){ while(state.queue.length<5) state.queue.push(rng.next().value); }
  function spawn(){ fillQueue(); const type=state.queue.shift(); fillQueue(); state.current={type,rot:0,x:Math.floor((COLS-4)/2),y:-1}; state.canHold=true; state.grounded=false; state.lockTimer=0; if(collides(state.current,state.grid)) state.running=false; renderHoldNext(); }
  const mat=p=>SHAPES[p.type][p.rot%4];
  function collides(p,g){ const m=mat(p); for(let y=0;y<4;y++) for(let x=0;x<4;x++) if(m[y][x]){ const gx=p.x+x, gy=p.y+y; if(gx<0||gx>=COLS||gy>=ROWS) return true; if(gy>=0 && g[gy][gx]) return true; } return false; }
  function attemptKick(np,from,to){ const key=`${from}>${to}`; const table=(np.type==='I')?KICKS.I:(np.type==='O'?null:KICKS.JLSTZ); if(!table) return !collides(np,state.grid); for(const [dx,dy] of table[key]||[[0,0]]){ const test={...np,x:np.x+dx,y:np.y+dy}; if(!collides(test,state.grid)){ Object.assign(np,test); return true; } } return false; }
  function rotate(dir=1){ if(!state.running||!state.current) return; const from=state.current.rot, to=(from+(dir>0?1:3))%4; const cand={...state.current,rot:to}; if(attemptKick(cand,from,to)){ state.current=cand; state.lastActionRotate=true; state.grounded=false; state.lockTimer=0; play('rotate'); } }
  function move(dx,dy){ if(!state.running||!state.current) return false; const p={...state.current,x:state.current.x+dx,y:state.current.y+dy}; if(!collides(p,state.grid)){ state.current=p; if(dy!==0) state.grounded=false; play('move'); return true; } return false; }
  function hardDrop(){ let d=0; while(move(0,1)) d++; lockPiece(true,d); play('hard'); }
  function softDrop(){ if(!move(0,1)) groundCheck(0); else play('soft'); }
  function hold(){ if(!state.canHold||!state.current) return; const t=state.current.type; if(state.hold){ state.current={type:state.hold,rot:0,x:Math.floor((COLS-4)/2),y:-1}; state.hold=t; } else { state.hold=t; spawn(); } state.canHold=false; play('hold'); renderHoldNext(); }
  function merge(p){ const m=mat(p); for(let y=0;y<4;y++) for(let x=0;x<4;x++) if(m[y][x]){ const gx=p.x+x, gy=p.y+y; if(gy>=0&&gy<ROWS&&gx>=0&&gx<COLS) state.grid[gy][gx]=p.type; } }
  function markClears(){ const rows=[]; for(let y=ROWS-1;y>=0;y--) if(state.grid[y].every(v=>v)){ rows.push(y); } if(!rows.length) return 0; for(const r of rows) state.clearing.push({row:r,prog:0}); return rows.length; }
  function finalizeClears(){ const rows=state.clearing.map(c=>c.row).sort((a,b)=>a-b); for(let i=rows.length-1;i>=0;i--){ state.grid.splice(rows[i],1); state.grid.unshift(Array(COLS).fill(0)); } state.clearing.length=0; }
  function isTSpin(lines){ if(!lines) return false; const p=state.current; if(!p||p.type!=='T'||!state.lastActionRotate) return false; const corners=[[0,0],[2,0],[0,2],[2,2]]; let filled=0; for(const [cx,cy] of corners){ const gx=p.x+cx, gy=p.y+cy; if(gx<0||gx>=COLS||gy<0||gy>=ROWS||state.grid[gy][gx]) filled++; } return filled>=3; }
  function score(lines,tSpin,hd){ let base=0; switch(lines){case 1:base=100;break;case 2:base=300;break;case 3:base=500;break;case 4:base=800;break;} if(tSpin) base=lines===1?400:lines===2?700:1200; if(state.backToBack&&(lines===4||tSpin)) base=Math.floor(base*1.5); base+=hd*2; if(state.combo>1) base+=state.combo*50; return base*state.level; }
  function lockPiece(hard=false,hd=0){ merge(state.current); const lines=markClears(); const tSpin=isTSpin(lines); if(lines){ state.combo++; const pts=score(lines,tSpin,hd); state.score+=pts; state.lines+=lines; state.energy+=25*lines+(tSpin?30:0)+(state.combo>1?10:0); const nl=Math.floor(state.lines/LEVEL_LINES)+1; if(nl!==state.level){ state.level=nl; updateSpeed(); play('level'); } state.backToBack=(lines===4||tSpin)?true:false; play('clear'); } else { state.combo=0; state.backToBack=false; state.energy+=5; } while(state.energy>=100){ state.energy-=100; state.bombs=Math.min(3,state.bombs+1); play('bombEarn'); } updateHUD(); spawn(); }
  function groundCheck(delta){ if(!state.current) return; const below={...state.current,y:state.current.y+1}; if(collides(below,state.grid)){ if(!state.grounded){ state.grounded=true; state.lockTimer=0; } else { state.lockTimer+=delta; if(state.lockTimer>=LOCK_DELAY_MS) lockPiece(false,0); } } else { state.grounded=false; state.lockTimer=0; } }
  function updateHUD(){ elScore&&(elScore.textContent=state.score); elLines&&(elLines.textContent=state.lines); elLevel&&(elLevel.textContent=state.level); if(state.score>state.high){ state.high=state.score; localStorage.setItem('bf_high',String(state.high)); } elHigh&&(elHigh.textContent=state.high); elPowerBar&&(elPowerBar.style.width=`${Math.min(100,state.energy)}%`); elBombs&&(elBombs.textContent=state.bombs); btnBomb&&(btnBomb.disabled=state.bombs<=0||!state.running); btnRestart&&(btnRestart.disabled=state.running); }

  // Rendering
  const DPR=Math.max(1,window.devicePixelRatio||1);
  let cssW=0, cssH=0;
  function resize(){ 
    const r=canvas.getBoundingClientRect(); 
    cssW=Math.max(300, Math.floor(r.width || canvas.clientWidth || 400)); 
    cssH=Math.max(400, Math.floor(r.height || canvas.clientHeight || 800)); 
    const w=Math.floor(cssW*DPR);
    const h=Math.floor(cssH*DPR);
    if(canvas.width!==w||canvas.height!==h){ 
      canvas.width=w; 
      canvas.height=h; 
    } 
    ctx.setTransform(1,0,0,1,0,0);
  } 
  resize(); 
  addEventListener('resize',resize);
  function cellGeom(){ const size=Math.floor(Math.min(cssW/COLS, cssH/ROWS)); const ox=Math.floor((cssW-size*COLS)/2), oy=Math.floor((cssH-size*ROWS)/2); return {size,ox,oy}; }
  function hexToRgb(h){ let c=h.replace('#',''); if(c.length===3) c=c.split('').map(x=>x+x).join(''); const n=parseInt(c,16); return {r:(n>>16)&255,g:(n>>8)&255,b:n&255}; }
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  function rgbToHex(r,g,b){ const t=v=>v.toString(16).padStart(2,'0'); return `#${t(r)}${t(g)}${t(b)}`; }
  function lighten(h,a){ const {r,g,b}=hexToRgb(h); return rgbToHex(clamp(r+(255-r)*a,0,255),clamp(g+(255-g)*a,0,255),clamp(b+(255-b)*a,0,255)); }
  function darken(h,a){ const {r,g,b}=hexToRgb(h); return rgbToHex(clamp(r*(1-a),0,255),clamp(g*(1-a),0,255),clamp(b*(1-a),0,255)); }
  function rr(x,y,w,h,r){ const R=Math.min(r,w/2,h/2); ctx.beginPath(); ctx.moveTo(x+R,y); ctx.arcTo(x+w,y,x+w,y+h,R); ctx.arcTo(x+w,y+h,x,y+h,R); ctx.arcTo(x,y+h,x,y,R); ctx.arcTo(x,y,x+w,y,R); ctx.closePath(); }
  function drawCell(x,y,s,col,a=1){ const px=x*s, py=y*s, r=Math.max(3,Math.floor(s*0.18)); ctx.save(); ctx.globalAlpha=a; const g=ctx.createLinearGradient(px,py,px,py+s); g.addColorStop(0,lighten(col,0.12)); g.addColorStop(1,darken(col,0.16)); ctx.fillStyle=g; rr(px+0.8,py+0.8,s-1.6,s-1.6,r); ctx.fill(); ctx.globalAlpha=a*0.8; ctx.strokeStyle='rgba(255,255,255,0.08)'; ctx.lineWidth=Math.max(1,s*0.06); ctx.stroke(); ctx.globalAlpha=a*0.5; ctx.shadowColor=col; ctx.shadowBlur=Math.max(4,Math.floor(s*0.4)); ctx.strokeStyle=col; ctx.stroke(); ctx.restore(); }
  function render(){ const {size,ox,oy}=cellGeom(); ctx.clearRect(0,0,canvas.width,canvas.height); ctx.save(); ctx.translate(ox,oy); if(state.gridEnabled){ ctx.save(); ctx.globalAlpha=0.08; ctx.strokeStyle='#5af1ff'; for(let x=0;x<=COLS;x++){ ctx.beginPath(); ctx.moveTo(x*size+0.5,0); ctx.lineTo(x*size+0.5,ROWS*size); ctx.stroke(); } for(let y=0;y<=ROWS;y++){ ctx.beginPath(); ctx.moveTo(0,y*size+0.5); ctx.lineTo(COLS*size,y*size+0.5); ctx.stroke(); } ctx.restore(); }
    for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++){ const v=state.grid[y][x]; if(v) drawCell(x,y,size,COLORS[v]); }
    if(state.clearing.length){ for(const c of state.clearing){ ctx.save(); ctx.globalAlpha=1-c.prog; ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.fillRect(0,c.row*size,COLS*size,size); ctx.restore(); } }
    if(state.current && state.running && state.ghostEnabled){ const gPiece={...state.current}; while(!collides({...gPiece,y:gPiece.y+1},state.grid)) gPiece.y++; const gm=mat(gPiece); for(let y=0;y<4;y++) for(let x=0;x<4;x++) if(gm[y][x]){ const gx=gPiece.x+x, gy=gPiece.y+y; if(gy>=0) drawCell(gx,gy,size,COLORS[gPiece.type],0.25); } }
    if(state.current){ const m=mat(state.current); for(let y=0;y<4;y++) for(let x=0;x<4;x++) if(m[y][x]){ const gx=state.current.x+x, gy=state.current.y+y; if(gy>=0) drawCell(gx,gy,size,COLORS[state.current.type]); } }
    ctx.restore();
    if(!state.running){ ctx.save(); ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#e8edf7'; ctx.font='bold 28px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace'; ctx.textAlign='center'; ctx.fillText('Game Over', canvas.width/2, canvas.height/2); ctx.restore(); }
    if(state.paused){ ctx.save(); ctx.fillStyle='rgba(0,0,0,0.45)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.restore(); }
  }
  function renderHoldNext(){ if(nextQueueEl){ nextQueueEl.innerHTML=''; for(const t of state.queue){ const c=document.createElement('canvas'); c.width=80; c.height=80; nextQueueEl.appendChild(c); drawMini(c.getContext('2d'),t); } } if(holdCanvas){ const hctx=holdCanvas.getContext('2d'); hctx.clearRect(0,0,holdCanvas.width,holdCanvas.height); if(state.hold) drawMini(hctx,state.hold); } }
  function drawMini(mctx,type){ const m=SHAPES[type][0]; for(let y=0;y<4;y++) for(let x=0;x<4;x++) if(m[y][x]){ mctx.fillStyle=COLORS[type]; mctx.fillRect(x*16+12,y*16+12,14,14); } }

  let audioCtx=null; const ac=()=>{ if(!state.soundEnabled) return null; if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)(); return audioCtx; };
  function play(kind){ if(!state.soundEnabled) return; const ctxA=ac(); if(!ctxA) return; const o=ctxA.createOscillator(), g=ctxA.createGain(); const freq={rotate:440,move:330,soft:300,hard:520,clear:660,level:800,bombEarn:900,hold:350}[kind]||280; o.frequency.value=freq; g.gain.value=0.15; g.gain.exponentialRampToValueAtTime(0.0001,ctxA.currentTime+0.25); o.connect(g).connect(ctxA.destination); o.start(); o.stop(ctxA.currentTime+0.25); }

  function useBomb(){ if(!state.running||state.paused||state.bombs<=0) return; let bestRow=0,best=-1; for(let y=0;y<ROWS;y++){ const c=state.grid[y].reduce((a,v)=>a+(v?1:0),0); if(c>best){ best=c; bestRow=y; } } state.grid.splice(bestRow,1); state.grid.unshift(Array(COLS).fill(0)); state.bombs--; play('clear'); updateHUD(); }

  const keys={left:false,right:false,down:false};
  function lateral(delta){ if(state.dasDir===0) return; state.dasTimer+=delta; if(state.dasTimer>=DAS_MS){ state.arrTimer+=delta; if(state.arrTimer>=ARR_MS){ state.arrTimer=0; move(state.dasDir,0); } } }
  function keyDown(e){ if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyZ','KeyX','ShiftLeft','ShiftRight','KeyC','KeyB','KeyP','KeyH'].includes(e.code)) e.preventDefault(); if(e.code==='KeyP'){ togglePause(); return; } if(state.paused||!state.running) return; switch(e.code){ case 'ArrowLeft': keys.left=true; state.dasDir=-1; state.dasTimer=0; state.arrTimer=0; move(-1,0); break; case 'ArrowRight': keys.right=true; state.dasDir=1; state.dasTimer=0; state.arrTimer=0; move(1,0); break; case 'ArrowDown': keys.down=true; softDrop(); break; case 'ArrowUp': case 'KeyX': rotate(1); break; case 'KeyZ': rotate(-1); break; case 'Space': hardDrop(); break; case 'ShiftLeft': case 'ShiftRight': case 'KeyH': hold(); break; case 'KeyB': case 'KeyC': useBomb(); break; } }
  function keyUp(e){ switch(e.code){ case 'ArrowLeft': keys.left=false; state.dasDir=keys.right?1:0; state.dasTimer=0; break; case 'ArrowRight': keys.right=false; state.dasDir=keys.left?-1:0; state.dasTimer=0; break; case 'ArrowDown': keys.down=false; break; } }
  addEventListener('keydown',keyDown); addEventListener('keyup',keyUp);
  function bind(btn,fn,repeat=false){ if(!btn) return; let t=null; const start=e=>{ e.preventDefault(); fn(); if(repeat) t=setInterval(fn,120); }; const stop=()=>{ if(t){ clearInterval(t); t=null; } }; btn.addEventListener('pointerdown',start); addEventListener('pointerup',stop); addEventListener('pointercancel',stop); btn.addEventListener('click', e=>e.preventDefault()); }
  bind(btnLeft,()=>move(-1,0),true); bind(btnRight,()=>move(1,0),true); bind(btnRotate,()=>rotate(1)); bind(btnSoft,()=>softDrop(),true); bind(btnHard,()=>hardDrop()); bind(btnMobBomb,()=>useBomb()); btnBomb&&btnBomb.addEventListener('click',()=>useBomb()); btnRestart&&btnRestart.addEventListener('click',()=>reset()); btnPause&&btnPause.addEventListener('click',()=>togglePause()); resumeBtn&&resumeBtn.addEventListener('click',()=>togglePause(false)); btnSettings&&btnSettings.addEventListener('click',()=>toggleSettings(true)); closeSettingsBtn&&closeSettingsBtn.addEventListener('click',()=>toggleSettings(false)); chkGhost&&chkGhost.addEventListener('change',()=>state.ghostEnabled=chkGhost.checked); chkSound&&chkSound.addEventListener('change',()=>state.soundEnabled=chkSound.checked); chkGrid&&chkGrid.addEventListener('change',()=>state.gridEnabled=chkGrid.checked);
  function togglePause(force){ if(!state.running) return; state.paused = typeof force==='boolean'? !force : !state.paused; pauseOverlay && (pauseOverlay.hidden=!state.paused); }
  function toggleSettings(show){ settingsPanel && (settingsPanel.hidden=!show); }
  function reset(){ Object.assign(state,{grid:createMatrix(COLS,ROWS,0), score:0, lines:0, level:1, energy:0, bombs:0, combo:0, backToBack:false, queue:[], hold:null, canHold:true, running:true, paused:false, dropCounter:0, lockTimer:0, grounded:false, clearing:[]}); updateSpeed(); fillQueue(); spawn(); updateHUD(); renderHoldNext(); }
  function updateClearing(delta){ if(!state.clearing.length) return; for(const c of state.clearing) c.prog += delta/300; if(state.clearing.every(c=>c.prog>=1)) finalizeClears(); }
  let last=0; function loop(t=0){ const d=t-last; last=t; if(state.running && !state.paused){ state.dropCounter+=d; groundCheck(d); if(state.dropCounter>=state.dropInterval){ state.dropCounter=0; if(!move(0,1)) groundCheck(d); } lateral(d); updateClearing(d); } render(); requestAnimationFrame(loop); }
  
  // Initialize game
  updateSpeed(); fillQueue(); spawn(); updateHUD(); renderHoldNext(); requestAnimationFrame(loop);
  } // end startGame
})();
