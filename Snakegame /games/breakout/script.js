const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game settings
const PADDLE_WIDTH = 120;
const PADDLE_HEIGHT = 20;
const BALL_RADIUS = 8;
const BRICK_ROWS = 5;
const BRICK_COLS = 10;
const BRICK_WIDTH = 75;
const BRICK_HEIGHT = 25;
const BRICK_PADDING = 5;
const BRICK_OFFSET_TOP = 60;
const BRICK_OFFSET_LEFT = 17.5;

// Game state
let paddle = {
  x: canvas.width / 2 - PADDLE_WIDTH / 2,
  y: canvas.height - 50,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT,
  speed: 8
};

let ball = {
  x: canvas.width / 2,
  y: canvas.height - 70,
  dx: 0,
  dy: 0,
  radius: BALL_RADIUS,
  speed: 4
};

let bricks = [];
let score = 0;
let lives = 3;
let level = 1;
let gameRunning = false;
let isPaused = false;
let ballLaunched = false;

// Colors for brick rows
const BRICK_COLORS = [
  '#FF6B6B', // Red
  '#F59563', // Orange
  '#FFD93D', // Yellow
  '#5ADC82', // Green
  '#4ECDC4'  // Cyan
];

// Controls
let keys = {};
let mouseX = canvas.width / 2;

// Initialize game
function init() {
  initBricks();
  newGame();
  gameLoop();
}

function newGame() {
  paddle.x = canvas.width / 2 - PADDLE_WIDTH / 2;
  ball.x = canvas.width / 2;
  ball.y = canvas.height - 70;
  ball.dx = 0;
  ball.dy = 0;
  ballLaunched = false;
  score = 0;
  lives = 3;
  level = 1;
  gameRunning = true;
  isPaused = false;
  
  initBricks();
  updateScore();
  
  document.getElementById('gameOverModal').hidden = true;
  document.getElementById('victoryModal').hidden = true;
  document.getElementById('pauseText').textContent = 'Пауза';
}

function nextLevel() {
  level++;
  ball.speed += 0.5;
  ballLaunched = false;
  ball.x = canvas.width / 2;
  ball.y = canvas.height - 70;
  ball.dx = 0;
  ball.dy = 0;
  paddle.x = canvas.width / 2 - PADDLE_WIDTH / 2;
  
  initBricks();
  updateScore();
  
  document.getElementById('victoryModal').hidden = true;
}

function initBricks() {
  bricks = [];
  for (let row = 0; row < BRICK_ROWS; row++) {
    bricks[row] = [];
    for (let col = 0; col < BRICK_COLS; col++) {
      bricks[row][col] = {
        x: col * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT,
        y: row * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP,
        status: 1,
        color: BRICK_COLORS[row % BRICK_COLORS.length]
      };
    }
  }
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

function update() {
  if (!gameRunning || isPaused) return;
  
  // Move paddle with keyboard
  if (keys['ArrowLeft'] && paddle.x > 0) {
    paddle.x -= paddle.speed;
  }
  if (keys['ArrowRight'] && paddle.x + paddle.width < canvas.width) {
    paddle.x += paddle.speed;
  }
  
  // Move paddle with mouse
  if (mouseX > 0) {
    paddle.x = mouseX - paddle.width / 2;
    paddle.x = Math.max(0, Math.min(paddle.x, canvas.width - paddle.width));
  }
  
  // Ball follows paddle before launch
  if (!ballLaunched) {
    ball.x = paddle.x + paddle.width / 2;
    ball.y = paddle.y - BALL_RADIUS - 2;
    return;
  }
  
  // Move ball
  ball.x += ball.dx;
  ball.y += ball.dy;
  
  // Wall collision
  if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
    ball.dx = -ball.dx;
  }
  
  if (ball.y - ball.radius < 0) {
    ball.dy = -ball.dy;
  }
  
  // Paddle collision
  if (
    ball.y + ball.radius > paddle.y &&
    ball.x > paddle.x &&
    ball.x < paddle.x + paddle.width
  ) {
    // Calculate hit position on paddle (-1 to 1)
    const hitPos = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
    ball.dx = hitPos * ball.speed;
    ball.dy = -Math.abs(ball.dy);
  }
  
  // Ball missed
  if (ball.y + ball.radius > canvas.height) {
    lives--;
    updateScore();
    
    if (lives <= 0) {
      gameOver();
    } else {
      resetBall();
    }
  }
  
  // Brick collision
  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let col = 0; col < BRICK_COLS; col++) {
      const brick = bricks[row][col];
      if (brick.status === 1) {
        if (
          ball.x + ball.radius > brick.x &&
          ball.x - ball.radius < brick.x + BRICK_WIDTH &&
          ball.y + ball.radius > brick.y &&
          ball.y - ball.radius < brick.y + BRICK_HEIGHT
        ) {
          ball.dy = -ball.dy;
          brick.status = 0;
          score += 10 * level;
          updateScore();
          
          // Check for level complete
          if (checkLevelComplete()) {
            victory();
          }
        }
      }
    }
  }
}

function draw() {
  // Clear canvas
  ctx.fillStyle = '#1a1f28';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw bricks
  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let col = 0; col < BRICK_COLS; col++) {
      const brick = bricks[row][col];
      if (brick.status === 1) {
        ctx.fillStyle = brick.color;
        ctx.fillRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT);
        
        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(brick.x, brick.y, BRICK_WIDTH, 4);
        
        // Border
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 2;
        ctx.strokeRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT);
      }
    }
  }
  
  // Draw paddle
  const gradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
  gradient.addColorStop(0, '#6ef09a');
  gradient.addColorStop(1, '#5ADC82');
  ctx.fillStyle = gradient;
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
  
  // Paddle highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fillRect(paddle.x, paddle.y, paddle.width, 4);
  
  // Draw ball
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.closePath();
  
  // Ball shadow
  ctx.beginPath();
  ctx.arc(ball.x + 2, ball.y + 2, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fill();
  ctx.closePath();
  
  // Show launch hint
  if (!ballLaunched) {
    ctx.font = '20px system-ui';
    ctx.fillStyle = 'rgba(230, 248, 238, 0.6)';
    ctx.textAlign = 'center';
    ctx.fillText('Нажмите SPACE для запуска', canvas.width / 2, canvas.height - 120);
  }
  
  // Show pause text
  if (isPaused) {
    ctx.font = 'bold 48px system-ui';
    ctx.fillStyle = 'rgba(230, 248, 238, 0.9)';
    ctx.textAlign = 'center';
    ctx.fillText('ПАУЗА', canvas.width / 2, canvas.height / 2);
  }
}

function launchBall() {
  if (!ballLaunched) {
    ballLaunched = true;
    const angle = (Math.random() * 60 - 30) * Math.PI / 180; // -30 to 30 degrees
    ball.dx = ball.speed * Math.sin(angle);
    ball.dy = -ball.speed * Math.cos(angle);
  }
}

function resetBall() {
  ballLaunched = false;
  ball.x = paddle.x + paddle.width / 2;
  ball.y = paddle.y - BALL_RADIUS - 2;
  ball.dx = 0;
  ball.dy = 0;
  paddle.x = canvas.width / 2 - PADDLE_WIDTH / 2;
}

function checkLevelComplete() {
  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let col = 0; col < BRICK_COLS; col++) {
      if (bricks[row][col].status === 1) {
        return false;
      }
    }
  }
  return true;
}

function updateScore() {
  document.getElementById('score').textContent = score;
  document.getElementById('lives').textContent = lives;
  document.getElementById('level').textContent = level;
}

function togglePause() {
  if (!gameRunning) return;
  isPaused = !isPaused;
  document.getElementById('pauseText').textContent = isPaused ? 'Продолжить' : 'Пауза';
}

function gameOver() {
  gameRunning = false;
  document.getElementById('finalScore').textContent = score;
  document.getElementById('gameOverModal').hidden = false;
}

function victory() {
  gameRunning = false;
  document.getElementById('victoryScore').textContent = score;
  document.getElementById('victoryModal').hidden = false;
}

// Event listeners
document.addEventListener('keydown', (e) => {
  keys[e.key] = true;
  
  if (e.key === ' ') {
    e.preventDefault();
    if (gameRunning && !isPaused) {
      launchBall();
    } else {
      togglePause();
    }
  }
  
  if (e.key === 'r' || e.key === 'R') {
    e.preventDefault();
    newGame();
  }
});

document.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
});

// Touch controls for mobile
let touchX = 0;

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (!ballLaunched) {
    launchBall();
  }
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  mouseX = touch.clientX - rect.left;
});

// Start game
init();

