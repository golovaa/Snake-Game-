const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_SIZE = 50;
const ENEMY_SIZE = 40;
const BULLET_SIZE = 6;

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// Game state
let player = {
  x: CANVAS_WIDTH / 2 - 25,
  y: CANVAS_HEIGHT - 100,
  width: PLAYER_SIZE,
  height: PLAYER_SIZE,
  speed: 6,
  hp: 3,
  shield: 0,
  thruster: 0
};

let enemies = [];
let bullets = [];
let enemyBullets = [];
let particles = [];
let stars = [];

let score = 0;
let lives = 3;
let wave = 1;
let gameRunning = false;
let isPaused = false;

// Weapon system
const WEAPONS = {
  basic: { name: 'Basic', cost: 0, damage: 1, cooldown: 300, unlocked: true, color: '#00ff88' },
  double: { name: 'Double', cost: 500, damage: 1, cooldown: 250, unlocked: false, color: '#ffaa00' },
  laser: { name: 'Laser', cost: 1000, damage: 3, cooldown: 600, unlocked: false, color: '#ff0066' },
  spread: { name: 'Spread', cost: 1500, damage: 1, cooldown: 400, unlocked: false, color: '#00aaff' }
};

let currentWeapon = 'basic';
let lastShot = 0;

// Boss system
let boss = null;
let isBossWave = false;

// Animation frame time
let lastTime = 0;
let deltaTime = 0;
let animationFrame = 0;

// Controls
let keys = {};
let mouseX = CANVAS_WIDTH / 2;
let mousePressed = false;

// Initialize starfield for 3D depth effect
function initStars() {
  stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * CANVAS_HEIGHT,
      z: Math.random() * 3, // depth
      speed: 0.5 + Math.random() * 1.5
    });
  }
}

// Initialize
function init() {
  console.log('🎮 Initializing Space Invaders...');
  
  if (!canvas) {
    console.error('❌ Canvas element not found!');
    return;
  }
  
  if (!ctx) {
    console.error('❌ Canvas context not available!');
    return;
  }
  
  console.log('✅ Canvas initialized:', CANVAS_WIDTH, 'x', CANVAS_HEIGHT);
  
  initStars();
  setupWeaponButtons();
  setupControls();
  newGame();
  gameLoop();
  
  console.log('✅ Game started!');
}

function setupControls() {
  document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ' && gameRunning && !isPaused) {
      e.preventDefault();
      shoot();
    }
    if (e.key === 'p' || e.key === 'P' || e.key === 'з' || e.key === 'З') {
      togglePause();
    }
    if ((e.key === 'r' || e.key === 'R') && !gameRunning) {
      newGame();
    }
    // Weapon switching
    if (e.key >= '1' && e.key <= '4') {
      const weaponKeys = ['basic', 'double', 'laser', 'spread'];
      const weaponType = weaponKeys[parseInt(e.key) - 1];
      if (WEAPONS[weaponType].unlocked) {
        currentWeapon = weaponType;
        updateWeaponUI();
      }
    }
  });

  document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
  });

  canvas.addEventListener('mousedown', () => {
    mousePressed = true;
  });

  canvas.addEventListener('mouseup', () => {
    mousePressed = false;
  });

  const pauseBtn = document.getElementById('pauseBtn');
  const restartBtn = document.getElementById('restartBtn');
  const nextWaveBtn = document.getElementById('nextWaveBtn');
  const retryBtn = document.getElementById('retryBtn');
  
  if (pauseBtn) pauseBtn.addEventListener('click', togglePause);
  if (restartBtn) restartBtn.addEventListener('click', () => {
    newGame();
  });
  if (nextWaveBtn) nextWaveBtn.addEventListener('click', nextWave);
  if (retryBtn) retryBtn.addEventListener('click', newGame);
}

function setupWeaponButtons() {
  const weaponButtons = document.querySelectorAll('.weapon-btn');
  weaponButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const weaponType = btn.dataset.weapon;
      const weapon = WEAPONS[weaponType];
      
      if (weapon.unlocked) {
        currentWeapon = weaponType;
        updateWeaponUI();
      } else if (score >= weapon.cost) {
        score -= weapon.cost;
        weapon.unlocked = true;
        btn.classList.remove('locked');
        currentWeapon = weaponType;
        updateScore();
        updateWeaponUI();
      }
    });
  });
}

function updateWeaponUI() {
  document.querySelectorAll('.weapon-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.weapon === currentWeapon) {
      btn.classList.add('active');
    }
  });
  document.getElementById('weapon').textContent = WEAPONS[currentWeapon].name;
}

function newGame() {
  console.log('🎮 Starting new game...');
  
  player.x = CANVAS_WIDTH / 2 - 25;
  player.y = CANVAS_HEIGHT - 100;
  player.hp = 3;
  
  enemies = [];
  bullets = [];
  enemyBullets = [];
  particles = [];
  boss = null;
  
  score = 0;
  lives = 3;
  wave = 1;
  gameRunning = true;
  isPaused = false;
  
  spawnEnemies();
  console.log('👾 Spawned', enemies.length, 'enemies');
  
  updateScore();
  document.getElementById('gameOverModal').hidden = true;
  document.getElementById('victoryModal').hidden = true;
  
  console.log('✅ Game ready!');
}

function nextWave() {
  wave++;
  
  bullets = [];
  enemyBullets = [];
  particles = [];
  boss = null;
  isBossWave = false;
  
  // Restore game state
  gameRunning = true;
  isPaused = false;
  
  document.getElementById('victoryModal').hidden = true;
  
  // Boss every 5 waves
  if (wave % 5 === 0) {
    showBossAlert();
  } else {
    spawnEnemies();
  }
  
  updateScore();
}

function showBossAlert() {
  isBossWave = true;
  const bossModal = document.getElementById('bossModal');
  const bossTimer = document.getElementById('bossTimer');
  bossModal.hidden = false;
  
  let countdown = 3;
  bossTimer.textContent = countdown;
  
  const interval = setInterval(() => {
    countdown--;
    if (countdown > 0) {
      bossTimer.textContent = countdown;
    } else {
      clearInterval(interval);
      bossModal.hidden = true;
      spawnBoss();
    }
  }, 1000);
}

function spawnEnemies() {
  const rows = 3 + Math.floor(wave / 2);
  const cols = 8;
  const enemyTypes = ['normal', 'fast', 'tank'];
  
  for (let row = 0; row < Math.min(rows, 5); row++) {
    for (let col = 0; col < cols; col++) {
      const typeIndex = Math.floor(Math.random() * 3);
      const type = enemyTypes[typeIndex];
      
      enemies.push({
        x: 50 + col * 90,
        y: 50 + row * 60,
        width: ENEMY_SIZE,
        height: ENEMY_SIZE,
        speed: type === 'fast' ? 1.5 : type === 'tank' ? 0.5 : 1,
        hp: type === 'tank' ? 3 : type === 'fast' ? 1 : 2,
        maxHp: type === 'tank' ? 3 : type === 'fast' ? 1 : 2,
        type: type,
        direction: 1,
        animFrame: Math.random() * 60
      });
    }
  }
}

function spawnBoss() {
  boss = {
    x: CANVAS_WIDTH / 2 - 60,
    y: 50,
    width: 120,
    height: 80,
    hp: 50 + wave * 10,
    maxHp: 50 + wave * 10,
    speedX: 2,
    phase: 1,
    attackCooldown: 0,
    attackInterval: 1000,
    animFrame: 0
  };
  enemies = [];
}

function togglePause() {
  if (gameRunning) {
    isPaused = !isPaused;
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) {
      pauseBtn.textContent = isPaused ? 'Продолжить' : 'Пауза';
    }
  }
}

function updateScore() {
  document.getElementById('score').textContent = score;
  document.getElementById('wave').textContent = wave;
  document.getElementById('lives').textContent = lives;
  document.getElementById('finalScore').textContent = score;
  document.getElementById('waveScore').textContent = score;
}

function gameLoop(currentTime = 0) {
  deltaTime = currentTime - lastTime;
  lastTime = currentTime;
  animationFrame++;
  
  // Only log first frame
  if (animationFrame === 1) {
    console.log('🎬 Game loop started!', 'Stars:', stars.length, 'Enemies:', enemies.length);
  }
  
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Draw starfield with parallax
  drawStarfield();
  
  if (gameRunning && !isPaused) {
    update();
  }
  
  draw();
  
  if (isPaused) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#fff';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }
  
  requestAnimationFrame(gameLoop);
}

function drawStarfield() {
  // Update and draw stars with 3D parallax
  stars.forEach(star => {
    star.y += star.speed * (star.z + 0.5);
    if (star.y > CANVAS_HEIGHT) {
      star.y = 0;
      star.x = Math.random() * CANVAS_WIDTH;
    }
    
    const size = 1 + star.z;
    const alpha = 0.3 + star.z * 0.3;
    
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fillRect(star.x, star.y, size, size);
  });
}

function update() {
  // Player movement
  if (keys['ArrowLeft'] || keys['a'] || keys['ф']) {
    player.x = Math.max(0, player.x - player.speed);
    player.thruster = Math.min(1, player.thruster + 0.1);
  } else if (keys['ArrowRight'] || keys['d'] || keys['в']) {
    player.x = Math.min(CANVAS_WIDTH - player.width, player.x + player.speed);
    player.thruster = Math.min(1, player.thruster + 0.1);
  } else {
    player.thruster = Math.max(0, player.thruster - 0.05);
  }
  
  // Mouse following
  if (Math.abs(mouseX - player.x - player.width / 2) > 10) {
    if (mouseX > player.x + player.width / 2) {
      player.x = Math.min(CANVAS_WIDTH - player.width, player.x + player.speed * 0.8);
    } else {
      player.x = Math.max(0, player.x - player.speed * 0.8);
    }
  }
  
  // Mouse shooting
  if (mousePressed) {
    shoot();
  }
  
  // Update bullets
  bullets = bullets.filter(bullet => {
    if (bullet.isLaser) {
      bullet.life--;
      return bullet.life > 0;
    } else {
      bullet.y -= bullet.speed;
      if (bullet.angle) {
        bullet.x += Math.sin(bullet.angle) * bullet.speed;
      }
      return bullet.y > 0 && bullet.x > 0 && bullet.x < CANVAS_WIDTH;
    }
  });
  
  // Update enemy bullets
  enemyBullets = enemyBullets.filter(bullet => {
    if (bullet.targetX !== undefined) {
      // Homing bullet
      const dx = bullet.targetX - bullet.x;
      const dy = bullet.targetY - bullet.y;
      const angle = Math.atan2(dy, dx);
      bullet.x += Math.cos(angle) * bullet.speed * 0.7;
      bullet.y += Math.sin(angle) * bullet.speed * 0.7;
    } else if (bullet.angle !== undefined) {
      bullet.x += Math.cos(bullet.angle) * bullet.speed;
      bullet.y += Math.sin(bullet.angle) * bullet.speed;
    } else {
      bullet.y += bullet.speed;
    }
    
    // Check collision with player
    if (checkCollision(bullet, player)) {
      player.hp--;
      lives--;
      createExplosion(player.x + player.width / 2, player.y + player.height / 2);
      updateScore();
      
      if (lives <= 0) {
        gameOver();
      }
      return false;
    }
    
    return bullet.y < CANVAS_HEIGHT && bullet.y > -10 && bullet.x > -10 && bullet.x < CANVAS_WIDTH + 10;
  });
  
  // Update particles
  particles = particles.filter(particle => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.life--;
    particle.vy += 0.2; // gravity
    return particle.life > 0;
  });
  
  // Update boss
  if (boss) {
    updateBoss();
  } else {
    // Update enemies
    updateEnemies();
  }
  
  // Check victory
  if (!boss && enemies.length === 0 && gameRunning) {
    victory();
  }
}

function updateEnemies() {
  let moveDown = false;
  
  enemies.forEach(enemy => {
    enemy.animFrame += 0.1;
    enemy.x += enemy.speed * enemy.direction;
    
    if (enemy.x <= 0 || enemy.x >= CANVAS_WIDTH - enemy.width) {
      moveDown = true;
    }
    
    // Enemy shooting
    const shootChance = 0.0005 + (wave * 0.0002);
    if (Math.random() < shootChance) {
      createEnemyBullet(enemy);
    }
  });
  
  if (moveDown) {
    enemies.forEach(enemy => {
      enemy.direction *= -1;
      enemy.y += 8;
      
      if (enemy.y + enemy.height >= player.y) {
        gameOver();
      }
    });
  }
  
  // Check collisions with bullets
  bullets = bullets.filter(bullet => {
    let hit = false;
    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      
      if (bullet.isLaser) {
        // Laser hits all enemies in column
        if (bullet.x >= enemy.x - 4 && bullet.x <= enemy.x + enemy.width + 4) {
          enemy.hp -= WEAPONS[currentWeapon].damage * 0.1;
          createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, WEAPONS[currentWeapon].color, 2);
          
          if (enemy.hp <= 0) {
            score += getEnemyScore(enemy.type);
            createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
            enemies.splice(i, 1);
            updateScore();
          }
        }
      } else if (checkCollision(bullet, enemy)) {
        enemy.hp -= WEAPONS[currentWeapon].damage;
        createParticles(bullet.x, bullet.y, WEAPONS[currentWeapon].color, 5);
        hit = true;
        
        if (enemy.hp <= 0) {
          score += getEnemyScore(enemy.type);
          createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
          enemies.splice(i, 1);
          updateScore();
        }
        break;
      }
    }
    return bullet.isLaser || !hit;
  });
}

function updateBoss() {
  boss.animFrame += 0.1;
  
  // Boss movement
  boss.x += boss.speedX;
  if (boss.x + boss.width > CANVAS_WIDTH || boss.x < 0) {
    boss.speedX *= -1;
  }
  
  // Boss attacks
  boss.attackCooldown -= deltaTime;
  if (boss.attackCooldown <= 0) {
    bossAttack();
    boss.attackCooldown = boss.attackInterval;
  }
  
  // Phase transitions
  const hpPercent = boss.hp / boss.maxHp;
  if (hpPercent <= 0.33 && boss.phase < 3) {
    boss.phase = 3;
    boss.attackInterval = 500;
  } else if (hpPercent <= 0.66 && boss.phase < 2) {
    boss.phase = 2;
    boss.attackInterval = 700;
  }
  
  // Check boss collisions
  bullets = bullets.filter(bullet => {
    if (bullet.isLaser) {
      if (bullet.x >= boss.x && bullet.x <= boss.x + boss.width) {
        boss.hp -= WEAPONS[currentWeapon].damage * 0.15;
        createParticles(bullet.x, boss.y + boss.height, '#ff0066', 3);
      }
      return true;
    } else if (checkCollision(bullet, boss)) {
      boss.hp -= WEAPONS[currentWeapon].damage;
      createParticles(bullet.x, bullet.y, WEAPONS[currentWeapon].color, 8);
      
      if (boss.hp <= 0) {
        score += 1000;
        createExplosion(boss.x + boss.width / 2, boss.y + boss.height / 2, true);
        boss = null;
        isBossWave = false;
        updateScore();
      }
      return false;
    }
    return true;
  });
}

function bossAttack() {
  if (!boss) return;
  
  const centerX = boss.x + boss.width / 2;
  const centerY = boss.y + boss.height;
  
  if (boss.phase === 1) {
    // Simple shot
    enemyBullets.push({
      x: centerX,
      y: centerY,
      width: 10,
      height: 10,
      speed: 5,
      color: '#ff4444'
    });
  } else if (boss.phase === 2) {
    // Spread shot
    for (let i = -1; i <= 1; i++) {
      enemyBullets.push({
        x: centerX,
        y: centerY,
        width: 8,
        height: 8,
        speed: 5,
        angle: Math.PI / 2 + i * 0.4,
        color: '#ff8800'
      });
    }
  } else if (boss.phase === 3) {
    // Homing + spread
    enemyBullets.push({
      x: centerX,
      y: centerY,
      width: 12,
      height: 12,
      speed: 4,
      targetX: player.x + player.width / 2,
      targetY: player.y + player.height / 2,
      color: '#ff00ff'
    });
    
    for (let i = -2; i <= 2; i++) {
      enemyBullets.push({
        x: centerX,
        y: centerY,
        width: 6,
        height: 6,
        speed: 6,
        angle: Math.PI / 2 + i * 0.3,
        color: '#ffaa00'
      });
    }
  }
}

function createEnemyBullet(enemy) {
  enemyBullets.push({
    x: enemy.x + enemy.width / 2,
    y: enemy.y + enemy.height,
    width: 8,
    height: 8,
    speed: 3 + wave * 0.2,
    color: enemy.type === 'fast' ? '#ffff00' : enemy.type === 'tank' ? '#ff0000' : '#ff6b6b'
  });
}

function shoot() {
  const now = Date.now();
  const weapon = WEAPONS[currentWeapon];
  
  if (now - lastShot < weapon.cooldown) return;
  
  lastShot = now;
  
  const centerX = player.x + player.width / 2;
  const weaponColor = weapon.color;
  
  switch (currentWeapon) {
    case 'basic':
      bullets.push({
        x: centerX,
        y: player.y,
        width: 6,
        height: 15,
        speed: 10,
        color: weaponColor,
        glow: true
      });
      break;
      
    case 'double':
      bullets.push({
        x: player.x + 15,
        y: player.y,
        width: 6,
        height: 15,
        speed: 10,
        color: weaponColor,
        glow: true
      });
      bullets.push({
        x: player.x + player.width - 15,
        y: player.y,
        width: 6,
        height: 15,
        speed: 10,
        color: weaponColor,
        glow: true
      });
      break;
      
    case 'laser':
      bullets.push({
        x: centerX,
        y: 0,
        width: 10,
        height: CANVAS_HEIGHT,
        speed: 0,
        color: weaponColor,
        life: 30,
        isLaser: true
      });
      break;
      
    case 'spread':
      for (let i = -2; i <= 2; i++) {
        bullets.push({
          x: centerX,
          y: player.y,
          width: 5,
          height: 12,
          speed: 9,
          angle: i * 0.2,
          color: weaponColor,
          glow: true
        });
      }
      break;
  }
}

function getEnemyScore(type) {
  return type === 'tank' ? 30 : type === 'fast' ? 20 : 10;
}

function checkCollision(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

function createParticles(x, y, color, count = 10) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 20 + Math.random() * 20,
      color: color,
      size: 2 + Math.random() * 3
    });
  }
}

function createExplosion(x, y, big = false) {
  const count = big ? 50 : 30;
  const colors = big ? ['#ff0000', '#ff6600', '#ffff00', '#ffffff'] : ['#ff6b6b', '#ffaa00', '#ffffff'];
  
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * (big ? 8 : 5),
      vy: (Math.random() - 0.5) * (big ? 8 : 5),
      life: big ? 60 : 40,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: big ? 4 + Math.random() * 4 : 2 + Math.random() * 3
    });
  }
}

function draw() {
  // Draw player with 3D effect
  drawPlayer();
  
  // Draw enemies
  enemies.forEach(enemy => drawEnemy(enemy));
  
  // Draw boss
  if (boss) drawBoss();
  
  // Draw bullets
  bullets.forEach(bullet => drawBullet(bullet));
  
  // Draw enemy bullets
  enemyBullets.forEach(bullet => drawEnemyBullet(bullet));
  
  // Draw particles
  particles.forEach(particle => drawParticle(particle));
}

function drawPlayer() {
  const x = player.x;
  const y = player.y;
  const w = player.width;
  const h = player.height;
  
  // Thruster effect
  if (player.thruster > 0) {
    ctx.fillStyle = `rgba(255, 100, 0, ${player.thruster * 0.5})`;
    ctx.fillRect(x + w/4, y + h, w/2, 10 * player.thruster);
  }
  
  // Ship shadow for 3D depth
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(x + 5, y + 5, w, h);
  
  // Main body with gradient
  const gradient = ctx.createLinearGradient(x, y, x, y + h);
  gradient.addColorStop(0, '#00aaff');
  gradient.addColorStop(0.5, '#0066cc');
  gradient.addColorStop(1, '#003366');
  ctx.fillStyle = gradient;
  
  // Ship body - futuristic design
  ctx.beginPath();
  ctx.moveTo(x + w/2, y); // Top point
  ctx.lineTo(x + w, y + h * 0.7); // Right wing
  ctx.lineTo(x + w * 0.75, y + h); // Right bottom
  ctx.lineTo(x + w * 0.25, y + h); // Left bottom
  ctx.lineTo(x, y + h * 0.7); // Left wing
  ctx.closePath();
  ctx.fill();
  
  // Cockpit with glow
  ctx.fillStyle = '#00ffff';
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(x + w/2, y + h/3, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  
  // Wing highlights
  ctx.strokeStyle = '#00ffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + w/2, y + h/4);
  ctx.lineTo(x + w * 0.8, y + h * 0.6);
  ctx.moveTo(x + w/2, y + h/4);
  ctx.lineTo(x + w * 0.2, y + h * 0.6);
  ctx.stroke();
  
  // Engine glow
  ctx.fillStyle = '#00ff88';
  ctx.shadowColor = '#00ff88';
  ctx.shadowBlur = 15;
  ctx.fillRect(x + w * 0.3, y + h * 0.9, w * 0.15, 8);
  ctx.fillRect(x + w * 0.55, y + h * 0.9, w * 0.15, 8);
  ctx.shadowBlur = 0;
}

function drawEnemy(enemy) {
  const x = enemy.x;
  const y = enemy.y;
  const w = enemy.width;
  const h = enemy.height;
  
  // Animation wobble
  const wobble = Math.sin(enemy.animFrame) * 2;
  
  // Shadow for depth
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.fillRect(x + 3, y + 3, w, h);
  
  // Color based on type
  let mainColor, accentColor;
  if (enemy.type === 'fast') {
    mainColor = '#ffff00';
    accentColor = '#ffaa00';
  } else if (enemy.type === 'tank') {
    mainColor = '#ff0000';
    accentColor = '#aa0000';
  } else {
    mainColor = '#00ff00';
    accentColor = '#00aa00';
  }
  
  // Main body with gradient
  const gradient = ctx.createRadialGradient(x + w/2, y + h/2, 0, x + w/2, y + h/2, w/2);
  gradient.addColorStop(0, mainColor);
  gradient.addColorStop(1, accentColor);
  ctx.fillStyle = gradient;
  
  // Alien body shape
  ctx.beginPath();
  ctx.ellipse(x + w/2, y + h * 0.4, w/2, h * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Eyes with animation
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x + w * 0.35 + wobble, y + h * 0.35, 5, 0, Math.PI * 2);
  ctx.arc(x + w * 0.65 - wobble, y + h * 0.35, 5, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#ff0000';
  ctx.beginPath();
  ctx.arc(x + w * 0.35 + wobble, y + h * 0.35, 3, 0, Math.PI * 2);
  ctx.arc(x + w * 0.65 - wobble, y + h * 0.35, 3, 0, Math.PI * 2);
  ctx.fill();
  
  // Tentacles
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x + w * (0.3 + i * 0.2), y + h * 0.7);
    ctx.lineTo(x + w * (0.3 + i * 0.2) + Math.sin(enemy.animFrame + i) * 3, y + h);
    ctx.stroke();
  }
  
  // HP bar
  if (enemy.hp < enemy.maxHp) {
    const hpWidth = w * (enemy.hp / enemy.maxHp);
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(x, y - 8, w, 4);
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(x, y - 8, hpWidth, 4);
  }
}

function drawBoss() {
  const x = boss.x;
  const y = boss.y;
  const w = boss.width;
  const h = boss.height;
  
  const pulse = Math.sin(boss.animFrame * 0.2) * 5;
  
  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(x + 5, y + 5, w, h);
  
  // Phase color
  let phaseColor;
  if (boss.phase === 3) {
    phaseColor = '#ff0000';
  } else if (boss.phase === 2) {
    phaseColor = '#ff8800';
  } else {
    phaseColor = '#ff00ff';
  }
  
  // Main body with glow
  ctx.fillStyle = phaseColor;
  ctx.shadowColor = phaseColor;
  ctx.shadowBlur = 20 + pulse;
  
  // Boss body - menacing design
  ctx.beginPath();
  ctx.moveTo(x + w/2, y);
  ctx.lineTo(x + w, y + h * 0.3);
  ctx.lineTo(x + w * 0.9, y + h * 0.7);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + w * 0.1, y + h * 0.7);
  ctx.lineTo(x, y + h * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  
  // Core
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.arc(x + w/2, y + h/2, 15 + pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  
  // Eyes
  ctx.fillStyle = '#ff0000';
  ctx.beginPath();
  ctx.arc(x + w * 0.35, y + h * 0.4, 8, 0, Math.PI * 2);
  ctx.arc(x + w * 0.65, y + h * 0.4, 8, 0, Math.PI * 2);
  ctx.fill();
  
  // Cannons
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = '#666';
    ctx.fillRect(x + w * (0.25 + i * 0.25) - 5, y + h, 10, 15);
  }
  
  // HP bar
  const hpBarWidth = w;
  const hpPercent = boss.hp / boss.maxHp;
  ctx.fillStyle = '#330000';
  ctx.fillRect(x, y - 15, hpBarWidth, 10);
  ctx.fillStyle = hpPercent > 0.66 ? '#00ff00' : hpPercent > 0.33 ? '#ffaa00' : '#ff0000';
  ctx.fillRect(x, y - 15, hpBarWidth * hpPercent, 10);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y - 15, hpBarWidth, 10);
}

function drawBullet(bullet) {
  if (bullet.isLaser) {
    // Laser beam effect
    ctx.shadowColor = bullet.color;
    ctx.shadowBlur = 20;
    ctx.fillStyle = bullet.color;
    ctx.globalAlpha = 0.7;
    ctx.fillRect(bullet.x - 5, 0, 10, CANVAS_HEIGHT);
    ctx.globalAlpha = 1;
    
    // Core beam
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bullet.x - 2, 0, 4, CANVAS_HEIGHT);
    ctx.shadowBlur = 0;
  } else {
    // Regular bullet with glow
    if (bullet.glow) {
      ctx.shadowColor = bullet.color;
      ctx.shadowBlur = 10;
    }
    
    ctx.fillStyle = bullet.color;
    
    // Bullet shape
    ctx.beginPath();
    ctx.ellipse(bullet.x, bullet.y, bullet.width / 2, bullet.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Trail
    ctx.globalAlpha = 0.5;
    ctx.fillRect(bullet.x - bullet.width / 4, bullet.y + bullet.height / 2, bullet.width / 2, bullet.height);
    ctx.globalAlpha = 1;
    
    ctx.shadowBlur = 0;
  }
}

function drawEnemyBullet(bullet) {
  ctx.shadowColor = bullet.color;
  ctx.shadowBlur = 8;
  ctx.fillStyle = bullet.color;
  
  // Rotating bullet
  ctx.save();
  ctx.translate(bullet.x, bullet.y);
  ctx.rotate(animationFrame * 0.1);
  
  ctx.fillRect(-bullet.width / 2, -bullet.height / 2, bullet.width, bullet.height);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.strokeRect(-bullet.width / 2, -bullet.height / 2, bullet.width, bullet.height);
  
  ctx.restore();
  ctx.shadowBlur = 0;
}

function drawParticle(particle) {
  ctx.fillStyle = particle.color;
  ctx.globalAlpha = particle.life / 40;
  ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
  ctx.globalAlpha = 1;
}

function victory() {
  gameRunning = false;
  document.getElementById('waveScore').textContent = score;
  document.getElementById('victoryModal').hidden = false;
}

function gameOver() {
  gameRunning = false;
  document.getElementById('finalScore').textContent = score;
  document.getElementById('gameOverModal').hidden = false;
}

// Start the game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
