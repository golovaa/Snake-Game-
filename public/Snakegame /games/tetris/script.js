// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');

// Game constants
const BLOCK_SIZE = 30;
const ROWS = 20;
const COLS = 10;
const COLORS = [
  '#FF6B6B', // I
  '#4ECDC4', // O
  '#FFD93D', // T
  '#6BCF7F', // S
  '#C792EA', // Z
  '#82AAFF', // J
  '#F78C6C'  // L
];

// Tetromino shapes
const SHAPES = [
  [[1,1,1,1]], // I
  [[1,1],[1,1]], // O
  [[0,1,0],[1,1,1]], // T
  [[0,1,1],[1,1,0]], // S
  [[1,1,0],[0,1,1]], // Z
  [[1,0,0],[1,1,1]], // J
  [[0,0,1],[1,1,1]]  // L
];

// Game state
let board = [];
let currentPiece = null;
let nextPiece = null;
let score = 0;
let level = 1;
let lines = 0;
let gameLoop = null;
let isPaused = false;
let gameOver = false;
let dropInterval = 1000;

// Initialize game
function init() {
  board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
  newGame();
}

function newGame() {
  board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
  score = 0;
  level = 1;
  lines = 0;
  isPaused = false;
  gameOver = false;
  dropInterval = 1000;
  
  updateScore();
  
  nextPiece = createPiece();
  spawnPiece();
  
  document.getElementById('gameOver').hidden = true;
  
  if (gameLoop) clearInterval(gameLoop);
  gameLoop = setInterval(gameStep, dropInterval);
  
  draw();
}

function createPiece() {
  const shapeIndex = Math.floor(Math.random() * SHAPES.length);
  return {
    shape: SHAPES[shapeIndex],
    color: COLORS[shapeIndex],
    x: Math.floor(COLS / 2) - Math.floor(SHAPES[shapeIndex][0].length / 2),
    y: 0
  };
}

function spawnPiece() {
  currentPiece = nextPiece;
  nextPiece = createPiece();
  
  if (!isValidMove(currentPiece.x, currentPiece.y, currentPiece.shape)) {
    endGame();
  }
  
  drawNextPiece();
}

function gameStep() {
  if (isPaused || gameOver) return;
  
  if (isValidMove(currentPiece.x, currentPiece.y + 1, currentPiece.shape)) {
    currentPiece.y++;
  } else {
    lockPiece();
    clearLines();
    spawnPiece();
  }
  
  draw();
}

function isValidMove(x, y, shape) {
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const newX = x + col;
        const newY = y + row;
        
        if (newX < 0 || newX >= COLS || newY >= ROWS) {
          return false;
        }
        
        if (newY >= 0 && board[newY][newX]) {
          return false;
        }
      }
    }
  }
  return true;
}

function lockPiece() {
  for (let row = 0; row < currentPiece.shape.length; row++) {
    for (let col = 0; col < currentPiece.shape[row].length; col++) {
      if (currentPiece.shape[row][col]) {
        const y = currentPiece.y + row;
        const x = currentPiece.x + col;
        if (y >= 0) {
          board[y][x] = currentPiece.color;
        }
      }
    }
  }
}

function clearLines() {
  let linesCleared = 0;
  
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row].every(cell => cell !== 0)) {
      board.splice(row, 1);
      board.unshift(Array(COLS).fill(0));
      linesCleared++;
      row++; // Check this row again
    }
  }
  
  if (linesCleared > 0) {
    lines += linesCleared;
    score += linesCleared * 100 * level;
    
    // Level up every 10 lines
    const newLevel = Math.floor(lines / 10) + 1;
    if (newLevel > level) {
      level = newLevel;
      dropInterval = Math.max(100, 1000 - (level - 1) * 100);
      clearInterval(gameLoop);
      gameLoop = setInterval(gameStep, dropInterval);
    }
    
    updateScore();
  }
}

function rotatePiece() {
  const rotated = currentPiece.shape[0].map((_, i) =>
    currentPiece.shape.map(row => row[i]).reverse()
  );
  
  if (isValidMove(currentPiece.x, currentPiece.y, rotated)) {
    currentPiece.shape = rotated;
    draw();
  }
}

function movePiece(dx, dy) {
  if (isValidMove(currentPiece.x + dx, currentPiece.y + dy, currentPiece.shape)) {
    currentPiece.x += dx;
    currentPiece.y += dy;
    draw();
  }
}

function hardDrop() {
  while (isValidMove(currentPiece.x, currentPiece.y + 1, currentPiece.shape)) {
    currentPiece.y++;
    score += 2;
  }
  lockPiece();
  clearLines();
  spawnPiece();
  draw();
  updateScore();
}

function draw() {
  // Clear canvas
  ctx.fillStyle = '#1a1f28';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw grid
  ctx.strokeStyle = 'rgba(90, 220, 130, 0.1)';
  ctx.lineWidth = 1;
  for (let row = 0; row <= ROWS; row++) {
    ctx.beginPath();
    ctx.moveTo(0, row * BLOCK_SIZE);
    ctx.lineTo(COLS * BLOCK_SIZE, row * BLOCK_SIZE);
    ctx.stroke();
  }
  for (let col = 0; col <= COLS; col++) {
    ctx.beginPath();
    ctx.moveTo(col * BLOCK_SIZE, 0);
    ctx.lineTo(col * BLOCK_SIZE, ROWS * BLOCK_SIZE);
    ctx.stroke();
  }
  
  // Draw locked pieces
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (board[row][col]) {
        drawBlock(ctx, col * BLOCK_SIZE, row * BLOCK_SIZE, board[row][col]);
      }
    }
  }
  
  // Draw current piece
  if (currentPiece) {
    for (let row = 0; row < currentPiece.shape.length; row++) {
      for (let col = 0; col < currentPiece.shape[row].length; col++) {
        if (currentPiece.shape[row][col]) {
          const x = (currentPiece.x + col) * BLOCK_SIZE;
          const y = (currentPiece.y + row) * BLOCK_SIZE;
          drawBlock(ctx, x, y, currentPiece.color);
        }
      }
    }
  }
}

function drawBlock(context, x, y, color) {
  // Main block
  context.fillStyle = color;
  context.fillRect(x + 1, y + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
  
  // Highlight
  context.fillStyle = 'rgba(255, 255, 255, 0.2)';
  context.fillRect(x + 2, y + 2, BLOCK_SIZE - 4, 4);
  
  // Shadow
  context.fillStyle = 'rgba(0, 0, 0, 0.2)';
  context.fillRect(x + 2, y + BLOCK_SIZE - 6, BLOCK_SIZE - 4, 4);
}

function drawNextPiece() {
  nextCtx.fillStyle = '#0f1319';
  nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
  
  if (!nextPiece) return;
  
  const offsetX = (nextCanvas.width - nextPiece.shape[0].length * 30) / 2;
  const offsetY = (nextCanvas.height - nextPiece.shape.length * 30) / 2;
  
  for (let row = 0; row < nextPiece.shape.length; row++) {
    for (let col = 0; col < nextPiece.shape[row].length; col++) {
      if (nextPiece.shape[row][col]) {
        drawBlock(nextCtx, offsetX + col * 30, offsetY + row * 30, nextPiece.color);
      }
    }
  }
}

function updateScore() {
  document.getElementById('score').textContent = score;
  document.getElementById('level').textContent = level;
  document.getElementById('lines').textContent = lines;
}

function endGame() {
  gameOver = true;
  clearInterval(gameLoop);
  document.getElementById('finalScore').textContent = score;
  document.getElementById('gameOver').hidden = false;
}

function togglePause() {
  isPaused = !isPaused;
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
  if (gameOver) return;
  
  switch(e.key) {
    case 'ArrowLeft':
      e.preventDefault();
      movePiece(-1, 0);
      break;
    case 'ArrowRight':
      e.preventDefault();
      movePiece(1, 0);
      break;
    case 'ArrowDown':
      e.preventDefault();
      movePiece(0, 1);
      score += 1;
      updateScore();
      break;
    case 'ArrowUp':
      e.preventDefault();
      rotatePiece();
      break;
    case ' ':
      e.preventDefault();
      if (!isPaused) {
        hardDrop();
      }
      break;
    case 'p':
    case 'P':
      e.preventDefault();
      togglePause();
      break;
    case 'r':
    case 'R':
      e.preventDefault();
      newGame();
      break;
  }
});

// Touch controls for mobile
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
});

canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  if (gameOver) return;
  
  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;
  
  const dx = touchEndX - touchStartX;
  const dy = touchEndY - touchStartY;
  
  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal swipe
    if (dx > 30) movePiece(1, 0);
    else if (dx < -30) movePiece(-1, 0);
  } else {
    // Vertical swipe
    if (dy > 30) movePiece(0, 1);
    else if (dy < -30) rotatePiece();
  }
});

// Start game
init();

