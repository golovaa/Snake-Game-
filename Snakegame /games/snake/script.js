const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const launcher = document.getElementById('launcher');

const GRID_SIZE = 30;
const TILE_COUNT = 20;
canvas.width = GRID_SIZE * TILE_COUNT;
canvas.height = GRID_SIZE * TILE_COUNT;

// Game state
let snake = [{x: 10, y: 10}];
let dx = 0;
let dy = 0;
let apple = {x: 15, y: 15};
let score = 0;
let gameLoop = null;
let isPaused = false;
let gameStarted = false;

// Start game on click
launcher.addEventListener('click', startGame);
launcher.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    startGame();
  }
});

function startGame() {
  launcher.style.display = 'none';
  gameStarted = true;
  newGame();
}

function newGame() {
  snake = [{x: 10, y: 10}];
  dx = 1;
  dy = 0;
  score = 0;
  isPaused = false;
  
  placeApple();
  updateScore();
  
  document.getElementById('gameOver').hidden = true;
  
  if (gameLoop) clearInterval(gameLoop);
  gameLoop = setInterval(update, 100);
}

function update() {
  if (isPaused) return;
  
  // Move snake
  const head = {x: snake[0].x + dx, y: snake[0].y + dy};
  
  // Check collision with walls
  if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
    endGame();
    return;
  }
  
  // Check collision with self
  for (let segment of snake) {
    if (head.x === segment.x && head.y === segment.y) {
      endGame();
      return;
    }
  }
  
  snake.unshift(head);
  
  // Check if ate apple
  if (head.x === apple.x && head.y === apple.y) {
    score += 10;
    updateScore();
    placeApple();
  } else {
    snake.pop();
  }
  
  draw();
}

function draw() {
  // Clear canvas
  ctx.fillStyle = '#1a1f28';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw grid
  ctx.strokeStyle = 'rgba(90, 220, 130, 0.1)';
  ctx.lineWidth = 1;
  
  for (let i = 0; i <= TILE_COUNT; i++) {
    ctx.beginPath();
    ctx.moveTo(i * GRID_SIZE, 0);
    ctx.lineTo(i * GRID_SIZE, canvas.height);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, i * GRID_SIZE);
    ctx.lineTo(canvas.width, i * GRID_SIZE);
    ctx.stroke();
  }
  
  // Draw apple
  const appleX = apple.x * GRID_SIZE;
  const appleY = apple.y * GRID_SIZE;
  
  // Apple body
  const appleGradient = ctx.createRadialGradient(
    appleX + GRID_SIZE * 0.4,
    appleY + GRID_SIZE * 0.4,
    0,
    appleX + GRID_SIZE * 0.5,
    appleY + GRID_SIZE * 0.5,
    GRID_SIZE * 0.6
  );
  appleGradient.addColorStop(0, '#ff6b6b');
  appleGradient.addColorStop(1, '#ee5253');
  
  ctx.fillStyle = appleGradient;
  ctx.beginPath();
  ctx.arc(appleX + GRID_SIZE / 2, appleY + GRID_SIZE / 2, GRID_SIZE * 0.4, 0, Math.PI * 2);
  ctx.fill();
  
  // Apple highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.beginPath();
  ctx.arc(appleX + GRID_SIZE * 0.4, appleY + GRID_SIZE * 0.35, GRID_SIZE * 0.15, 0, Math.PI * 2);
  ctx.fill();
  
  // Apple stem
  ctx.strokeStyle = '#4a4a4a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(appleX + GRID_SIZE * 0.5, appleY + GRID_SIZE * 0.2);
  ctx.quadraticCurveTo(appleX + GRID_SIZE * 0.4, appleY + GRID_SIZE * 0.1, appleX + GRID_SIZE * 0.35, appleY + GRID_SIZE * 0.15);
  ctx.stroke();
  
  // Draw snake
  snake.forEach((segment, index) => {
    const x = segment.x * GRID_SIZE;
    const y = segment.y * GRID_SIZE;
    
    // Snake gradient
    const gradient = ctx.createLinearGradient(x, y, x + GRID_SIZE, y + GRID_SIZE);
    gradient.addColorStop(0, '#6ef09a');
    gradient.addColorStop(1, '#5ADC82');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x + 2, y + 2, GRID_SIZE - 4, GRID_SIZE - 4);
    
    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(x + 3, y + 3, GRID_SIZE - 6, 4);
    
    // Eyes on head
    if (index === 0) {
      ctx.fillStyle = '#1a1f28';
      
      if (dx === 1) { // Moving right
        ctx.fillRect(x + GRID_SIZE - 10, y + 8, 4, 4);
        ctx.fillRect(x + GRID_SIZE - 10, y + GRID_SIZE - 12, 4, 4);
      } else if (dx === -1) { // Moving left
        ctx.fillRect(x + 6, y + 8, 4, 4);
        ctx.fillRect(x + 6, y + GRID_SIZE - 12, 4, 4);
      } else if (dy === 1) { // Moving down
        ctx.fillRect(x + 8, y + GRID_SIZE - 10, 4, 4);
        ctx.fillRect(x + GRID_SIZE - 12, y + GRID_SIZE - 10, 4, 4);
      } else if (dy === -1) { // Moving up
        ctx.fillRect(x + 8, y + 6, 4, 4);
        ctx.fillRect(x + GRID_SIZE - 12, y + 6, 4, 4);
      }
    }
  });
  
  // Draw pause overlay
  if (isPaused) {
    ctx.fillStyle = 'rgba(26, 31, 40, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = 'bold 48px system-ui';
    ctx.fillStyle = '#e6f8ee';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ПАУЗА', canvas.width / 2, canvas.height / 2);
  }
}

function placeApple() {
  let validPosition = false;
  
  while (!validPosition) {
    apple = {
      x: Math.floor(Math.random() * TILE_COUNT),
      y: Math.floor(Math.random() * TILE_COUNT)
    };
    
    validPosition = true;
    for (let segment of snake) {
      if (segment.x === apple.x && segment.y === apple.y) {
        validPosition = false;
        break;
      }
    }
  }
}

function updateScore() {
  document.getElementById('score').textContent = score;
}

function endGame() {
  clearInterval(gameLoop);
  document.getElementById('finalScore').textContent = score;
  document.getElementById('gameOver').hidden = false;
}

function togglePause() {
  if (!gameStarted) return;
  isPaused = !isPaused;
  if (!isPaused) {
    draw();
  }
}

// Keyboard controls
let lastDirection = {dx: 1, dy: 0};

document.addEventListener('keydown', (e) => {
  if (!gameStarted) return;
  
  switch(e.key) {
    case 'ArrowUp':
      if (lastDirection.dy !== 1) {
        dx = 0;
        dy = -1;
        lastDirection = {dx, dy};
      }
      e.preventDefault();
      break;
    case 'ArrowDown':
      if (lastDirection.dy !== -1) {
        dx = 0;
        dy = 1;
        lastDirection = {dx, dy};
      }
      e.preventDefault();
      break;
    case 'ArrowLeft':
      if (lastDirection.dx !== 1) {
        dx = -1;
        dy = 0;
        lastDirection = {dx, dy};
      }
      e.preventDefault();
      break;
    case 'ArrowRight':
      if (lastDirection.dx !== -1) {
        dx = 1;
        dy = 0;
        lastDirection = {dx, dy};
      }
      e.preventDefault();
      break;
    case ' ':
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

// Touch controls
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
  
  if (!gameStarted) return;
  
  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;
  
  const diffX = touchEndX - touchStartX;
  const diffY = touchEndY - touchStartY;
  
  if (Math.abs(diffX) > Math.abs(diffY)) {
    // Horizontal swipe
    if (diffX > 0 && lastDirection.dx !== -1) {
      dx = 1;
      dy = 0;
      lastDirection = {dx, dy};
    } else if (diffX < 0 && lastDirection.dx !== 1) {
      dx = -1;
      dy = 0;
      lastDirection = {dx, dy};
    }
  } else {
    // Vertical swipe
    if (diffY > 0 && lastDirection.dy !== -1) {
      dx = 0;
      dy = 1;
      lastDirection = {dx, dy};
    } else if (diffY < 0 && lastDirection.dy !== 1) {
      dx = 0;
      dy = -1;
      lastDirection = {dx, dy};
    }
  }
});

// Initial draw
draw();

