// === Настройки поля ===
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const SIZE = 26;      // размер клетки (px)
const COLS = Math.floor(canvas.width / SIZE);
const ROWS = Math.floor(canvas.height / SIZE);
const SPEED_MS = 90;  // скорость (мс)
const INSET = 3;      // отступ для скруглённых сегментов

// DOM для HUD
const scoreEl = document.getElementById('hud-score');
const statusEl = document.getElementById('hud-status');
const restartBtn = document.getElementById('restart');

// Цвета
const GRID = '#161C24';
const HEAD = {r: 90, g: 220, b: 130};
const TAIL = {r: 20, g: 120, b: 80};
const APPLE = {r: 220, g: 40, b: 52};
const APPLE_EDGE = {r: 150, g: 20, b: 28};

// === Состояние игры ===
let snake, dir, nextDir, apple, grow, score, paused, over, timer;

function newGame() {
  snake = [{x: Math.floor(COLS/2), y: Math.floor(ROWS/2)},
           {x: Math.floor(COLS/2)-1, y: Math.floor(ROWS/2)},
           {x: Math.floor(COLS/2)-2, y: Math.floor(ROWS/2)}];
  dir = {x: 1, y: 0};
  nextDir = {...dir};
  score = 0;
  grow = 0;
  paused = false;
  over = false;
  placeApple();
  updateHUD();
  clearInterval(timer);
  timer = setInterval(tick, SPEED_MS);
  draw();
}

function updateHUD() {
  scoreEl.textContent = 'Счёт: ' + score;
  statusEl.textContent = over
    ? 'GAME OVER — нажми R для перезапуска'
    : (paused ? 'PAUSED — нажми Space для продолжения' : 'Игра идёт — Space: пауза');
}

function placeApple() {
  while (true) {
    const p = {x: Math.floor(Math.random()*COLS), y: Math.floor(Math.random()*ROWS)};
    if (!snake.some(s => s.x===p.x && s.y===p.y)) { apple = p; return; }
  }
}

function lerp(a, b, t) { return a + (b - a) * t; }
function lerpColor(A, B, t) {
  return `rgb(${Math.round(lerp(A.r,B.r,t))}, ${Math.round(lerp(A.g,B.g,t))}, ${Math.round(lerp(A.b,B.b,t))})`;
}

function drawGrid() {
  ctx.save();
  ctx.strokeStyle = GRID;
  ctx.lineWidth = 1;
  for (let c=0; c<=COLS; c++) {
    const x = c * SIZE;
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x, ROWS*SIZE); ctx.stroke();
  }
  for (let r=0; r<=ROWS; r++) {
    const y = r * SIZE;
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(COLS*SIZE, y); ctx.stroke();
  }
  ctx.restore();
}

function roundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
}

function cellRect(c, inset=INSET) {
  return {
    x: c.x*SIZE + inset,
    y: c.y*SIZE + inset,
    w: SIZE - inset*2,
    h: SIZE - inset*2
  };
}

function drawApple() {
  const r = cellRect(apple, 2);
  // Яблоко — эллипс с радиальным глянцем
  const cx = r.x + r.w/2, cy = r.y + r.h/2, rad = Math.max(r.w, r.h) * 0.6;
  const grad = ctx.createRadialGradient(cx, cy, r.w*.2, cx, cy, rad);
  grad.addColorStop(0, `rgb(${APPLE.r},${APPLE.g},${APPLE.b})`);
  grad.addColorStop(1, `rgb(${APPLE_EDGE.r},${APPLE_EDGE.g},${APPLE_EDGE.b})`);
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.ellipse(cx, cy, r.w/2, r.h/2, 0, 0, Math.PI*2); ctx.fill();

  // Блик
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath();
  ctx.ellipse(r.x + r.w/2.8, r.y + r.h/3.2, r.w/5, r.h/5, 0, 0, Math.PI*2);
  ctx.fill();

  // Листик
  ctx.fillStyle = '#3CB45A';
  ctx.beginPath();
  ctx.ellipse(r.x + r.w*0.65, r.y - r.h*0.20, r.w*0.22, r.h*0.38, 0, 0, Math.PI*2);
  ctx.fill();

  // Хвостик
  ctx.strokeStyle = 'rgba(120,70,40,0.9)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, r.y - 2);
  ctx.lineTo(cx, r.y - r.h/5);
  ctx.stroke();
}

function drawSnake() {
  for (let i=0; i<snake.length; i++) {
    const t = snake.length <= 1 ? 0 : i/(snake.length-1);
    const colA = lerpColor(HEAD, TAIL, t*0.85);
    const colB = lerpColor(HEAD, TAIL, Math.min(1, t+0.15));
    const r = cellRect(snake[i], INSET);
    const radius = Math.max(6, SIZE/2);

    const grad = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
    grad.addColorStop(0, colA);
    grad.addColorStop(1, colB);
    ctx.fillStyle = grad;
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1.5;

    roundedRect(r.x, r.y, r.w, r.h, radius);
    ctx.fill();
    ctx.stroke();
  }

  // глазки
  if (snake.length) {
    const r = cellRect(snake[0], INSET+2);
    const eye = Math.max(2, SIZE/8);
    ctx.fillStyle = '#1e1e1e';
    ctx.beginPath(); ctx.arc(r.x + eye, r.y + eye, eye/2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(r.x + r.w - 2*eye, r.y + eye, eye/2, 0, Math.PI*2); ctx.fill();
  }
}

function draw() {
  ctx.clearRect(0,0,canvas.width, canvas.height);
  drawGrid();
  drawApple();
  drawSnake();
}

function tick() {
  if (paused || over) return;

  // принять новый вектор направления (без разворота на 180)
  if ((nextDir.x !== -dir.x) || (nextDir.y !== -dir.y)) {
    dir = nextDir;
  }

  const head = snake[0];
  const nh = {x: head.x + dir.x, y: head.y + dir.y};

  // столкновения
  if (nh.x < 0 || nh.y < 0 || nh.x >= COLS || nh.y >= ROWS ||
      snake.some(s => s.x===nh.x && s.y===nh.y)) {
    over = true; updateHUD(); draw(); return;
  }

  snake.unshift(nh);
  if (nh.x === apple.x && nh.y === apple.y) {
    score += 10; grow += 2; updateHUD(); placeApple();
  }
  if (grow > 0) { grow--; } else { snake.pop(); }

  draw();
}

// === Управление ===
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft'  && dir.x !==  1) nextDir = {x:-1,y:0};
  if (e.key === 'ArrowRight' && dir.x !== -1) nextDir = {x: 1,y:0};
  if (e.key === 'ArrowUp'    && dir.y !==  1) nextDir = {x:0,y:-1};
  if (e.key === 'ArrowDown'  && dir.y !== -1) nextDir = {x:0,y: 1};
  if (e.key === ' ') { paused = !paused; updateHUD(); }
  if (e.code === 'KeyR') newGame();
});

restartBtn.addEventListener('click', newGame);

// Свайпы для сенсорных устройств
let touchStart = null;
canvas.addEventListener('touchstart', e => { touchStart = e.changedTouches[0]; }, {passive:true});
canvas.addEventListener('touchend', e => {
  if (!touchStart) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStart.clientX;
  const dy = t.clientY - touchStart.clientY;
  const ax = Math.abs(dx), ay = Math.abs(dy);
  if (Math.max(ax, ay) < 12) return;
  if (ax > ay) {
    if (dx < 0 && dir.x !== 1) nextDir = {x:-1,y:0};
    if (dx > 0 && dir.x !== -1) nextDir = {x: 1,y:0};
  } else {
    if (dy < 0 && dir.y !== 1) nextDir = {x:0,y:-1};
    if (dy > 0 && dir.y !== -1) nextDir = {x:0,y: 1};
  }
  touchStart = null;
}, {passive:true});

// старт
newGame();
