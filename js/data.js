/* ============================================================
 VIDYA STEM – Data Module
 js/data.js  |  v3.0.0

 • Loads item master JSONs (cached in memory per session)
 • Resolves item codes to full item objects for a lab
 • Saves/loads audit results to localStorage (compact format)
 ============================================================ */

const dataStore = (() => {

  const _cache = {};           // { lab1: [...], lab2: [...], lab3: [...] }
  const AUDIT_KEY = APP_CONFIG.storage.audits;
  let firebaseDB = null;
  let dbAudits = {}; // memory mirror

  /* ── Initialize Data ── */
  async function init() {
    if (APP_CONFIG.firebaseConfig && APP_CONFIG.firebaseConfig.apiKey !== "YOUR_API_KEY") {
      if (!window.firebase.apps.length) {
        window.firebase.initializeApp(APP_CONFIG.firebaseConfig);
      }
      firebaseDB = window.firebase.database();

      // Fetch initial data
      const snap = await firebaseDB.ref('audits').once('value');
      dbAudits = snap.val() || {};
      localStorage.setItem(AUDIT_KEY, JSON.stringify(dbAudits));

      // Listen for updates
      firebaseDB.ref('audits').on('value', snapshot => {
        dbAudits = snapshot.val() || {};
        localStorage.setItem(AUDIT_KEY, JSON.stringify(dbAudits));
      });
    } else {
      // Fallback to local storage if Firebase is not configured
      try { dbAudits = JSON.parse(localStorage.getItem(AUDIT_KEY) || '{}'); }
      catch { dbAudits = {}; }
    }
  }

  /* ── Load item master file ── */
  async function _loadFile(labKey) {
    if (_cache[labKey]) return _cache[labKey];
    const url = APP_CONFIG.itemFiles[labKey];
    if (!url) return [];
    const r = await fetch(url + '?v=' + Date.now());
    if (!r.ok) throw new Error(`Cannot load ${labKey} items`);
    _cache[labKey] = await r.json();
    return _cache[labKey];
  }

  /* ── Resolve items for a user's lab ── */
  async function resolveLabItems(labDef) {
    // labDef.image tells us which file (lab1 / lab2 / lab3)
    const fileKey = labDef.image || 'lab1';
    const all = await _loadFile(fileKey);
    const codes = labDef.items || [];
    return all.filter(item => codes.includes(item.code));
  }

  /* ── Audit storage (compact) ── */
  // Structure: { [auditId]: { meta, results } }
  // meta: { user, school, lab, labName, ts, total }
  // results: [ [code, status], ... ]  ← minimal footprint

  function getAudits() {
    return dbAudits;
  }

  function saveAudit(auditId, meta, decisions) {
    const audits = getAudits();
    audits[auditId] = {
      meta,
      results: decisions.map(d => {
        // If it starts with a number or contains custom text, save full status
        if (/^\d/.test(d.status)) {
          return [d.item.code, d.status];
        }
        return [d.item.code, d.status.charAt(0)];
      })
    };

    // Prune old audits (keep last 200 locally)
    const keys = Object.keys(audits);
    if (keys.length > 200) {
      const oldest = keys.sort().slice(0, keys.length - 200);
      oldest.forEach(k => delete audits[k]);
    }

    // Update local mirror immediately
    dbAudits = audits;
    localStorage.setItem(AUDIT_KEY, JSON.stringify(dbAudits));

    // Save to Firebase
    if (firebaseDB) {
      firebaseDB.ref('audits/' + auditId).set(audits[auditId]).catch(err => {
        console.error('[Firebase] Save error:', err);
      });
    }
  }

  function expandAudit(auditId) {
    const audits = getAudits();
    const a = audits[auditId];
    if (!a) return null;
    const map = { W: 'Well Present', B: 'Broken', M: 'Missing' };
    return {
      meta: a.meta,
      results: a.results.map(([code, s]) => {
        if (s.length > 1) return { code, status: s };
        return { code, status: map[s] || s };
      })
    };
  }

  function getAuditsByUser(username) {
    const all = getAudits();
    return Object.entries(all)
      .filter(([, v]) => v.meta && v.meta.user === username)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.meta.ts - a.meta.ts);
  }

  function getAllAudits() {
    const all = getAudits();
    return Object.entries(all)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.meta.ts - a.meta.ts);
  }

  function generateAuditId(username, lab) {
    return `${username}_${lab}_${Date.now()}`;
  }

  return {
    init,
    resolveLabItems,
    saveAudit,
    expandAudit,
    getAuditsByUser,
    getAllAudits,
    generateAuditId,
    getItemsByCode: async function (codes, fileKey) {
      const all = await _loadFile(fileKey);
      return all.filter(i => codes.includes(i.code));
    },
    getItemNameMap: async function (labKey) {
      try {
        // Strip _kit suffix to get file base.
        const fileKey = labKey ? labKey.split('_')[0] : '';
        const mapsToLoad = ['lab1', 'lab2', 'lab3'];

        // If a specific fileKey is valid, load it first
        if (mapsToLoad.includes(fileKey)) {
          const index = mapsToLoad.indexOf(fileKey);
          mapsToLoad.splice(index, 1);
          mapsToLoad.unshift(fileKey); // prioritize fileKey
        }

        const map = {};
        for (const key of mapsToLoad) {
          try {
            const all = await _loadFile(key);
            all.forEach(item => {
              map[item.code] = item.name;
            });
          } catch (err) {
            console.error(`Error loading ${key} in map:`, err);
          }
        }
        return map;
      } catch (e) {
        console.error('Error getting item name map:', e);
        return {};
      }
    }
  };
})();
