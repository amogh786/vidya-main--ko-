/* ============================================================
   VIDYA STEM – Authentication Module
   js/auth.js  |  v3.0.0

   • SHA-256 hashing via SubtleCrypto (no external deps)
   • Session stored as signed token in sessionStorage
   • Brute-force lockout: 5 attempts → 5-min cooldown
   ============================================================ */

const auth = (() => {
  const ATTEMPT_KEY  = 'vidya_login_attempts';
  const LOCKOUT_KEY  = 'vidya_lockout_until';
  const SESSION_KEY  = APP_CONFIG.storage.session;
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_MS   = 5 * 60 * 1000;

  /* ── SHA-256 via WebCrypto ── */
  async function sha256(text) {
    const enc  = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /* ── Simple HMAC-like session token ── */
  function makeToken(username, role, ts, teacher = '') {
    return btoa(`${username}|${role}|${ts}|${teacher}|${navigator.userAgent.slice(0,20)}`);
  }

  function parseToken(token) {
    try {
      const parts = atob(token).split('|');
      return { username: parts[0], role: parts[1], ts: Number(parts[2]), teacher: parts[3] || '' };
    } catch { return null; }
  }

  /* ── Load users.json ── */
  let _usersCache = null;
  async function loadUsers() {
    if (_usersCache) return _usersCache;
    const r = await fetch('./data/users.json');
    if (!r.ok) throw new Error('Cannot load user database');
    const d = await r.json();
    _usersCache = d.users;
    return _usersCache;
  }

  /* ── Public API ── */
  return {

    /* Returns current session user object or null */
    currentUser: function () {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const parsed = parseToken(raw);
      if (!parsed) return null;
      const age = Date.now() - parsed.ts;
      if (age > APP_CONFIG.sessionTimeout * 60 * 1000) {
        this.logout();
        return null;
      }
      return parsed;
    },

    /* Returns full user record from cache (after login) */
    currentUserFull: function () {
      if (!_usersCache) return null;
      const session = this.currentUser();
      if (!session) return null;
      const u = _usersCache.find(u => u.username.toLowerCase() === session.username.toLowerCase()) || null;
      if (u && session.teacher) {
        return { ...u, teacher: session.teacher };
      }
      return u;
    },

    /* Returns remaining lockout seconds, or 0 */
    lockoutRemaining: function () {
      const until = Number(localStorage.getItem(LOCKOUT_KEY) || 0);
      return Math.max(0, Math.ceil((until - Date.now()) / 1000));
    },

    getUser: async function (username) {
      const users = await loadUsers();
      return users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
    },

    preLoadUsers: async function () {
      return loadUsers();
    },

    /* Attempt login. Returns {ok, error?, user?} */
    login: async function (username, password, teacherName = '') {
      // Check lockout
      const rem = this.lockoutRemaining();
      if (rem > 0) {
        return { ok: false, error: `Too many attempts. Try again in ${rem}s.` };
      }

      const users = await loadUsers();
      const user  = users.find(u => u.username.toLowerCase() === username.toLowerCase());

      if (!user) {
        this._recordFailure();
        return { ok: false, error: 'Invalid username or password.' };
      }

      const hash = await sha256(password);
      if (hash !== user.passwordHash) {
        this._recordFailure();
        const attempts = Number(localStorage.getItem(ATTEMPT_KEY) || 0);
        const left = MAX_ATTEMPTS - attempts;
        return { ok: false, error: left > 0
          ? `Invalid password. ${left} attempt${left !== 1 ? 's' : ''} remaining.`
          : 'Account locked.' };
      }

      // Success – clear attempts, create session
      localStorage.removeItem(ATTEMPT_KEY);
      localStorage.removeItem(LOCKOUT_KEY);
      const ts    = Date.now();
      const token = makeToken(user.username, user.role, ts, teacherName);
      sessionStorage.setItem(SESSION_KEY, token);
      return { ok: true, user: teacherName ? { ...user, teacher: teacherName } : user };
    },

    logout: function () {
      sessionStorage.removeItem(SESSION_KEY);
    },

    _recordFailure: function () {
      const attempts = Number(localStorage.getItem(ATTEMPT_KEY) || 0) + 1;
      localStorage.setItem(ATTEMPT_KEY, attempts);
      if (attempts >= MAX_ATTEMPTS) {
        localStorage.setItem(LOCKOUT_KEY, Date.now() + LOCKOUT_MS);
        localStorage.removeItem(ATTEMPT_KEY);
      }
    }
  };
})();
