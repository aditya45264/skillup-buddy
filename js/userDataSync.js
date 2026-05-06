// js/userDataSync.js - COMPLETE FIXED VERSION
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : `http://${window.location.hostname}:5000`;
const UserDataSync = {
  _isSyncing: false,
  _syncQueue: [],
  _retryAttempts: 0,
  _maxRetries: 3,
  _bookmarkDebounce: {},

  async init() {
    const token = this.getToken();
    if (token) {
      await this.syncFromServer();
      this.startAutoSync();
    }
  },

  getToken() {
    return localStorage.getItem('sb_token') || localStorage.getItem('skillupToken');
  },

  isLoggedIn() {
    const token = this.getToken();
    const user = localStorage.getItem('sb_user') || localStorage.getItem('skillupUser');
    return !!(token && user);
  },

  async syncFromServer() {
    if (this._isSyncing) {
      return new Promise((resolve) => this._syncQueue.push(resolve));
    }

    this._isSyncing = true;

    try {
      const token = this.getToken();
      if (!token) {
        this._isSyncing = false;
        return null;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_BASE}/api/user/complete-data`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          this.handleAuthError();
          this._isSyncing = false;
          return null;
        }
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      
      localStorage.setItem('sb_user', JSON.stringify(data.user));
      localStorage.setItem('skillupUser', JSON.stringify(data.user));
      
      if (data.quizResults && data.quizResults.completedAt) {
        localStorage.setItem('skillsQuizResults', JSON.stringify(data.quizResults));
      }
      
      if (data.bookmarkedCourses) {
        const cleanBookmarks = Array.isArray(data.bookmarkedCourses) 
          ? data.bookmarkedCourses.map(id => String(id)).filter(id => id && id !== 'undefined')
          : [];
        localStorage.setItem('bookmarkedCourses', JSON.stringify(cleanBookmarks));
      }

      this._retryAttempts = 0;
      this._syncQueue.forEach(resolve => resolve(data));
      this._syncQueue = [];
      this._isSyncing = false;
      return data;

    } catch (error) {
      console.error('Sync error:', error);
      
      if (this._retryAttempts < this._maxRetries && error.name !== 'AbortError') {
        this._retryAttempts++;
        this._isSyncing = false;
        await new Promise(resolve => setTimeout(resolve, 1000 * this._retryAttempts));
        return this.syncFromServer();
      }
      
      this._isSyncing = false;
      this._syncQueue.forEach(resolve => resolve(null));
      this._syncQueue = [];
      return null;
    }
  },

  async saveQuizResults(quizData) {
    try {
      const token = this.getToken();
      if (!token) {
        localStorage.setItem('skillsQuizResults', JSON.stringify(quizData));
        return { success: false, message: 'Saved locally only' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_BASE}/api/user/quiz-results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(quizData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('Failed to save');

      const data = await response.json();
      localStorage.setItem('sb_user', JSON.stringify(data.user));
      localStorage.setItem('skillupUser', JSON.stringify(data.user));
      localStorage.setItem('skillsQuizResults', JSON.stringify(quizData));

      return { success: true, data };
    } catch (error) {
      localStorage.setItem('skillsQuizResults', JSON.stringify(quizData));
      return { success: false, message: error.message };
    }
  },

  async toggleBookmark(courseId) {
    const normalizedId = String(courseId);
    
    if (this._bookmarkDebounce[normalizedId]) {
      return this._bookmarkDebounce[normalizedId];
    }

    const operation = (async () => {
      try {
        const bookmarks = JSON.parse(localStorage.getItem('bookmarkedCourses') || '[]');
        const normalizedBookmarks = bookmarks.map(id => String(id));
        const isBookmarked = normalizedBookmarks.includes(normalizedId);
        const action = isBookmarked ? 'remove' : 'add';

        let newBookmarks;
        if (action === 'add') {
          newBookmarks = [...normalizedBookmarks, normalizedId];
        } else {
          newBookmarks = normalizedBookmarks.filter(id => id !== normalizedId);
        }
        
        localStorage.setItem('bookmarkedCourses', JSON.stringify(newBookmarks));

        const token = this.getToken();
        if (token) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(`${API_BASE}/api/user/bookmarks`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ courseId: normalizedId, action }),
              signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
              const data = await response.json();
              if (data.bookmarkedCourses) {
                const serverBookmarks = data.bookmarkedCourses.map(id => String(id));
                localStorage.setItem('bookmarkedCourses', JSON.stringify(serverBookmarks));
                return serverBookmarks;
              }
            }
          } catch (syncError) {
            console.warn('Server sync error:', syncError);
          }
        }

        return newBookmarks;
      } catch (error) {
        console.error('Error toggling bookmark:', error);
        const bookmarks = JSON.parse(localStorage.getItem('bookmarkedCourses') || '[]');
        return bookmarks.map(id => String(id));
      } finally {
        setTimeout(() => delete this._bookmarkDebounce[normalizedId], 500);
      }
    })();

    this._bookmarkDebounce[normalizedId] = operation;
    return operation;
  },

  async syncBookmarks() {
    try {
      const token = this.getToken();
      if (!token) return;

      const bookmarks = JSON.parse(localStorage.getItem('bookmarkedCourses') || '[]');
      const normalizedBookmarks = bookmarks.map(id => String(id)).filter(id => id && id !== 'undefined');

      await fetch(`${API_BASE}/api/user/bookmarks/sync`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bookmarkedCourses: normalizedBookmarks })
      });
    } catch (error) {
      console.error('Error syncing bookmarks:', error);
    }
  },

  async updateStats(stats) {
    try {
      const token = this.getToken();
      if (!token) return;

      await fetch(`${API_BASE}/api/user/stats`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(stats)
      });
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  },

  handleAuthError() {
    this.clearLocalData();
    const currentPath = window.location.pathname;
    if (!currentPath.includes('user_login.html') && 
        !currentPath.includes('user_registration.html') &&
        !currentPath.includes('index.html')) {
      setTimeout(() => window.location.href = '/pages/user_login.html', 1000);
    }
  },

  clearLocalData() {
    localStorage.removeItem('sb_token');
    localStorage.removeItem('skillupToken');
    localStorage.removeItem('sb_user');
    localStorage.removeItem('skillupUser');
    localStorage.removeItem('skillsQuizResults');
    localStorage.removeItem('bookmarkedCourses');
    localStorage.removeItem('skillsQuizProgress');
    localStorage.setItem('isLoggedIn', 'false');
  },

  startAutoSync() {
    setInterval(async () => {
      const token = this.getToken();
      if (token && !this._isSyncing) {
        await this.syncFromServer();
      }
    }, 30000);
  }
};

async function handleLogin(email, password) {
  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Login failed');

    localStorage.setItem('sb_token', data.token);
    localStorage.setItem('skillupToken', data.token);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('sb_user', JSON.stringify(data.user));
    localStorage.setItem('skillupUser', JSON.stringify(data.user));

    await UserDataSync.syncFromServer();
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

function handleLogout() {
  UserDataSync.clearLocalData();
  const currentPath = window.location.pathname;
  if (currentPath.includes('/pages/')) {
    window.location.href = '../index.html';
  } else {
    window.location.href = '/index.html';
  }
}

document.addEventListener('DOMContentLoaded', function() {
  UserDataSync.init().catch(err => console.error('Failed to initialize sync:', err));
  
  if (UserDataSync.isLoggedIn()) {
    const user = JSON.parse(localStorage.getItem('sb_user') || '{}');
    console.log('User authenticated:', user.email);
  }
});

window.UserDataSync = UserDataSync;
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;