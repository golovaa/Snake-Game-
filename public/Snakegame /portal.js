// Elements
let menuBtn, settingsMenu, closeSettings, profileBtn, profileModal, closeProfile, searchInput;
let themeSelect, soundToggle, notificationsToggle, languageSelect;

// User state
let currentUser = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Get elements after DOM is loaded
  menuBtn = document.getElementById('menuBtn');
  settingsMenu = document.getElementById('settingsMenu');
  closeSettings = document.getElementById('closeSettings');
  profileBtn = document.getElementById('profileBtn');
  profileModal = document.getElementById('profileModal');
  closeProfile = document.getElementById('closeProfile');
  searchInput = document.getElementById('searchInput');
  
  // Проверка наличия элементов
  console.log('Menu button:', menuBtn);
  console.log('Settings menu:', settingsMenu);
  console.log('Profile button:', profileBtn);
  console.log('Profile modal:', profileModal);
  
  // Settings elements
  themeSelect = document.getElementById('themeSelect');
  soundToggle = document.getElementById('soundToggle');
  notificationsToggle = document.getElementById('notificationsToggle');
  languageSelect = document.getElementById('languageSelect');
  
  // Setup event listeners
  if (menuBtn) {
    menuBtn.addEventListener('click', openSettings);
  } else {
    console.error('Menu button not found!');
  }
  
  if (closeSettings) {
    closeSettings.addEventListener('click', closeSettingsMenu);
  } else {
    console.error('Close settings button not found!');
  }
  
  if (profileBtn) {
    profileBtn.addEventListener('click', openProfile);
  } else {
    console.error('Profile button not found!');
  }
  
  if (closeProfile) {
    closeProfile.addEventListener('click', closeProfileModal);
  } else {
    console.error('Close profile button not found!');
  }
  
  themeSelect.addEventListener('change', (e) => {
    applyTheme(e.target.value);
    saveSettings();
  });
  
  soundToggle.addEventListener('change', saveSettings);
  notificationsToggle.addEventListener('change', saveSettings);
  languageSelect.addEventListener('change', (e) => {
    changeLanguage(e.target.value);
    saveSettings();
  });
  
  // Search functionality
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const gameCards = document.querySelectorAll('.game-card');
    
    gameCards.forEach(card => {
      const title = card.querySelector('.game-title').textContent.toLowerCase();
      const description = card.querySelector('.game-description').textContent.toLowerCase();
      
      if (title.includes(query) || description.includes(query)) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  });
  
  // Close modals on outside click
  profileModal.addEventListener('click', (e) => {
    if (e.target === profileModal) {
      closeProfileModal();
    }
  });
  
  // Close settings on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!settingsMenu.hidden) {
        closeSettingsMenu();
      }
      if (!profileModal.hidden) {
        closeProfileModal();
      }
    }
  });
  
  loadSettings();
  loadUser();
  initLoginButtons();
});

function openSettings() {
  if (!settingsMenu) {
    console.error('Settings menu element not found!');
    return;
  }
  console.log('Opening settings menu');
  settingsMenu.hidden = false;
  settingsMenu.style.transform = 'translateX(0)';
}

function closeSettingsMenu() {
  if (!settingsMenu) {
    console.error('Settings menu element not found!');
    return;
  }
  console.log('Closing settings menu');
  settingsMenu.style.transform = 'translateX(-100%)';
  setTimeout(() => {
    settingsMenu.hidden = true;
  }, 300); // Подождать завершения анимации
}

function openProfile() {
  if (!profileModal) {
    console.error('Profile modal element not found!');
    return;
  }
  console.log('Opening profile modal');
  if (currentUser) {
    showUserProfile();
  } else {
    // Restore original login form if needed
    if (!profileModal.dataset.originalContent) {
      const profileBody = document.querySelector('.profile-body');
      if (profileBody) {
        profileModal.dataset.originalContent = profileBody.innerHTML;
      }
    }
    initLoginButtons();
  }
  profileModal.hidden = false;
}

function closeProfileModal() {
  profileModal.hidden = true;
  // Restore original content if showing user profile
  if (currentUser && profileModal.dataset.originalContent) {
    document.querySelector('.profile-body').innerHTML = profileModal.dataset.originalContent;
    delete profileModal.dataset.originalContent;
    initLoginButtons();
  }
}

// Settings
function saveSettings() {
  const settings = {
    theme: themeSelect.value,
    sound: soundToggle.checked,
    notifications: notificationsToggle.checked,
    language: languageSelect.value
  };
  localStorage.setItem('gameHubSettings', JSON.stringify(settings));
}

function loadSettings() {
  const settings = JSON.parse(localStorage.getItem('gameHubSettings') || '{}');
  
  if (settings.theme) {
    themeSelect.value = settings.theme;
    applyTheme(settings.theme);
  } else {
    applyTheme('dark');
  }
  
  if (settings.sound !== undefined) {
    soundToggle.checked = settings.sound;
  }
  
  if (settings.notifications !== undefined) {
    notificationsToggle.checked = settings.notifications;
  }
  
  if (settings.language) {
    languageSelect.value = settings.language;
    changeLanguage(settings.language);
  } else {
    // Default to Ukrainian
    languageSelect.value = 'uk';
    changeLanguage('uk');
  }
}

// Theme switching
function applyTheme(theme) {
  const body = document.body;
  
  if (theme === 'light') {
    body.classList.add('light-theme');
  } else if (theme === 'dark') {
    body.classList.remove('light-theme');
  } else if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      body.classList.remove('light-theme');
    } else {
      body.classList.add('light-theme');
    }
  }
}

// Language switching
const translations = {
  uk: {
    'settings': 'Налаштування',
    'theme': 'Тема оформлення',
    'theme-dark': 'Темна',
    'theme-light': 'Світла',
    'theme-auto': 'Автоматично',
    'sounds': 'Звуки',
    'notifications': 'Сповіщення',
    'language': 'Мова',
    'profile': 'Профіль',
    'profile-subtitle': 'Увійдіть, щоб зберегти свій прогрес',
    'signin-google': 'Увійти через Google',
    'or': 'або',
    'continue-guest': 'Продовжити як гість',
    'popular-games': 'Популярні ігри',
    'game-snake-title': 'Змійка',
    'game-snake-desc': 'Класична аркадна гра. Керуйте змійкою, збирайте яблука і набирайте очки!',
    'game-tetris-title': 'Тетріс',
    'game-tetris-desc': 'Легендарна головоломка! Обертайте та розставляйте фігури, щоб заповнити лінії.',
    'game-2048-desc': "Об'єднуйте плитки з однаковими числами, щоб досягти 2048 і побити рекорд!",
    'game-breakout-desc': 'Класичний арканоїд! Розбивайте цеглинки м\'ячем і набирайте максимум очок.',
    'game-space-title': 'Space Invaders',
    'game-space-desc': 'Захищайте Землю від прибульців! 4 типи зброї, боси та епічні битви!',
    'category-arcade': 'Аркада',
    'category-puzzle': 'Головоломка',
    'category-logic': 'Логіка',
    'category-action': 'Екшн',
    'category-shooter': 'Шутер'
  },
  en: {
    'settings': 'Settings',
    'theme': 'Theme',
    'theme-dark': 'Dark',
    'theme-light': 'Light',
    'theme-auto': 'Auto',
    'sounds': 'Sounds',
    'notifications': 'Notifications',
    'language': 'Language',
    'profile': 'Profile',
    'profile-subtitle': 'Sign in to save your progress',
    'signin-google': 'Sign in with Google',
    'or': 'or',
    'continue-guest': 'Continue as Guest',
    'popular-games': 'Popular Games',
    'game-snake-title': 'Snake',
    'game-snake-desc': 'Classic arcade game. Control the snake, collect apples and earn points!',
    'game-tetris-title': 'Tetris',
    'game-tetris-desc': 'Legendary puzzle! Rotate and arrange shapes to fill lines.',
    'game-2048-desc': 'Merge tiles with the same numbers to reach 2048 and beat the record!',
    'game-breakout-desc': 'Classic breakout! Smash bricks with the ball and earn maximum points.',
    'game-space-title': 'Space Invaders',
    'game-space-desc': 'Defend Earth from aliens! 4 weapon types, bosses and epic battles!',
    'category-arcade': 'Arcade',
    'category-puzzle': 'Puzzle',
    'category-logic': 'Logic',
    'category-action': 'Action',
    'category-shooter': 'Shooter'
  }
};

function changeLanguage(lang) {
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });
}

// User management
function loadUser() {
  const userData = localStorage.getItem('gameHubUser');
  if (userData) {
    currentUser = JSON.parse(userData);
    updateUserUI();
  }
}

function saveUser(user) {
  localStorage.setItem('gameHubUser', JSON.stringify(user));
  currentUser = user;
  updateUserUI();
}

function updateUserUI() {
  if (currentUser) {
    // User is logged in - could update profile button appearance
    // For now, keep it simple
  }
}

function generateGuestName() {
  const randomNum = Math.floor(Math.random() * 1000) + 1;
  return `guest_${randomNum}`;
}

function initLoginButtons() {
  const googleBtn = document.getElementById('googleSignIn');
  const guestBtn = document.getElementById('guestBtn');
  
  if (googleBtn) {
    googleBtn.addEventListener('click', () => {
      alert('Google authentication coming soon!');
    });
  }
  
  if (guestBtn) {
    guestBtn.addEventListener('click', () => {
      const username = generateGuestName();
      const user = {
        username: username,
        type: 'guest',
        joinDate: new Date().toISOString()
      };
      
      saveUser(user);
      
      const lang = languageSelect.value;
      const welcomeMsg = lang === 'en' 
        ? `Welcome, ${username}!\n\nYour progress will be saved locally.`
        : `Ласкаво просимо, ${username}!\n\nВаш прогрес буде збережено локально.`;
      
      alert(welcomeMsg);
      closeProfileModal();
    });
  }
}

function showUserProfile() {
  const profileBody = document.querySelector('.profile-body');
  
  // Save original content if not already saved
  if (!profileModal.dataset.originalContent) {
    profileModal.dataset.originalContent = profileBody.innerHTML;
  }
  
  profileBody.innerHTML = `
    <div style="text-align: center;">
      <div style="width: 80px; height: 80px; margin: 0 auto 16px; background: linear-gradient(135deg, #5ADC82, #6ef09a); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; color: white;">
        ${currentUser.username.charAt(0).toUpperCase()}
      </div>
      <h3 style="font-size: 1.5rem; margin-bottom: 8px; color: #e6f8ee;">${currentUser.username}</h3>
      <p style="color: rgba(230, 248, 238, 0.6); font-size: 0.9rem; margin-bottom: 24px;">
        ${currentUser.type === 'guest' ? (languageSelect.value === 'en' ? 'Guest User' : 'Гостьовий користувач') : 'User'}
      </p>
      <button onclick="handleLogout()" style="padding: 12px 32px; background: rgba(255, 107, 107, 0.1); border: 1px solid rgba(255, 107, 107, 0.3); border-radius: 12px; color: #ff6b6b; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">
        ${languageSelect.value === 'en' ? 'Logout' : 'Вийти'}
      </button>
    </div>
  `;
}

function logout() {
  localStorage.removeItem('gameHubUser');
  currentUser = null;
  
  const lang = languageSelect.value;
  const logoutMsg = lang === 'en' 
    ? 'You have been logged out'
    : 'Ви вийшли з акаунту';
  
  alert(logoutMsg);
  
  // Restore original login form
  const profileBody = document.querySelector('.profile-body');
  if (profileModal.dataset.originalContent) {
    profileBody.innerHTML = profileModal.dataset.originalContent;
    delete profileModal.dataset.originalContent;
    initLoginButtons();
  }
  
  updateUserUI();
}

// Make logout available globally
window.handleLogout = logout;
