const GRID_SIZE = 4;
let grid = [];
let score = 0;
let bestScore = 0;
let hasWon = false;
let canContinue = false;

// Initialize
function init() {
  loadBestScore();
  newGame();
}

function newGame() {
  grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
  score = 0;
  hasWon = false;
  canContinue = false;
  
  document.getElementById('gameOverModal').hidden = true;
  document.getElementById('winModal').hidden = true;
  
  addRandomTile();
  addRandomTile();
  
  updateDisplay();
}

function addRandomTile() {
  const emptyCells = [];
  
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (grid[i][j] === 0) {
        emptyCells.push({x: i, y: j});
      }
    }
  }
  
  if (emptyCells.length > 0) {
    const {x, y} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    grid[x][y] = Math.random() < 0.9 ? 2 : 4;
  }
}

function move(direction) {
  let moved = false;
  const oldGrid = JSON.stringify(grid);
  
  if (direction === 'left') {
    for (let i = 0; i < GRID_SIZE; i++) {
      const { line, didMove } = mergeLine(grid[i]);
      grid[i] = line;
      moved = moved || didMove;
    }
  } else if (direction === 'right') {
    for (let i = 0; i < GRID_SIZE; i++) {
      const reversed = grid[i].reverse();
      const { line, didMove } = mergeLine(reversed);
      grid[i] = line.reverse();
      moved = moved || didMove;
    }
  } else if (direction === 'up') {
    for (let j = 0; j < GRID_SIZE; j++) {
      const column = grid.map(row => row[j]);
      const { line, didMove } = mergeLine(column);
      line.forEach((val, i) => grid[i][j] = val);
      moved = moved || didMove;
    }
  } else if (direction === 'down') {
    for (let j = 0; j < GRID_SIZE; j++) {
      const column = grid.map(row => row[j]).reverse();
      const { line, didMove } = mergeLine(column);
      line.reverse().forEach((val, i) => grid[i][j] = val);
      moved = moved || didMove;
    }
  }
  
  if (moved) {
    addRandomTile();
    updateDisplay();
    
    if (!hasWon && checkWin()) {
      hasWon = true;
      showWinModal();
    } else if (isGameOver()) {
      showGameOverModal();
    }
  }
}

function mergeLine(line) {
  let didMove = false;
  
  // Remove zeros
  let newLine = line.filter(val => val !== 0);
  
  // Merge adjacent equal values
  for (let i = 0; i < newLine.length - 1; i++) {
    if (newLine[i] === newLine[i + 1]) {
      newLine[i] *= 2;
      score += newLine[i];
      newLine.splice(i + 1, 1);
      didMove = true;
    }
  }
  
  // Fill with zeros
  while (newLine.length < GRID_SIZE) {
    newLine.push(0);
  }
  
  // Check if line changed
  if (JSON.stringify(line) !== JSON.stringify(newLine)) {
    didMove = true;
  }
  
  return { line: newLine, didMove };
}

function checkWin() {
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (grid[i][j] === 2048) {
        return true;
      }
    }
  }
  return false;
}

function isGameOver() {
  // Check for empty cells
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (grid[i][j] === 0) {
        return false;
      }
    }
  }
  
  // Check for possible merges
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      const current = grid[i][j];
      
      if (j < GRID_SIZE - 1 && current === grid[i][j + 1]) {
        return false;
      }
      
      if (i < GRID_SIZE - 1 && current === grid[i + 1][j]) {
        return false;
      }
    }
  }
  
  return true;
}

function updateDisplay() {
  // Update score
  document.getElementById('score').textContent = score;
  
  if (score > bestScore) {
    bestScore = score;
    saveBestScore();
  }
  document.getElementById('best').textContent = bestScore;
  
  // Update grid
  const gridElement = document.getElementById('grid');
  gridElement.innerHTML = '';
  
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      const tile = document.createElement('div');
      tile.className = 'tile';
      
      const value = grid[i][j];
      if (value !== 0) {
        tile.textContent = value;
        tile.setAttribute('data-value', value);
        tile.classList.add('tile-new');
      }
      
      gridElement.appendChild(tile);
    }
  }
}

function showWinModal() {
  document.getElementById('winModal').hidden = false;
}

function showGameOverModal() {
  document.getElementById('finalScore').textContent = score;
  document.getElementById('gameOverModal').hidden = false;
}

function continueGame() {
  canContinue = true;
  document.getElementById('winModal').hidden = true;
}

function saveBestScore() {
  localStorage.setItem('2048-best', bestScore);
}

function loadBestScore() {
  bestScore = parseInt(localStorage.getItem('2048-best') || '0');
  document.getElementById('best').textContent = bestScore;
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
  if (e.key.startsWith('Arrow')) {
    e.preventDefault();
  }
  
  switch(e.key) {
    case 'ArrowLeft':
      move('left');
      break;
    case 'ArrowRight':
      move('right');
      break;
    case 'ArrowUp':
      move('up');
      break;
    case 'ArrowDown':
      move('down');
      break;
    case 'r':
    case 'R':
      newGame();
      break;
  }
});

// Touch controls
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

const gridElement = document.getElementById('grid');

document.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
  touchStartY = e.changedTouches[0].screenY;
}, false);

document.addEventListener('touchend', (e) => {
  touchEndX = e.changedTouches[0].screenX;
  touchEndY = e.changedTouches[0].screenY;
  handleSwipe();
}, false);

function handleSwipe() {
  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;
  const minSwipeDistance = 50;
  
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    // Horizontal swipe
    if (Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        move('right');
      } else {
        move('left');
      }
    }
  } else {
    // Vertical swipe
    if (Math.abs(deltaY) > minSwipeDistance) {
      if (deltaY > 0) {
        move('down');
      } else {
        move('up');
      }
    }
  }
}

// Start game
init();

