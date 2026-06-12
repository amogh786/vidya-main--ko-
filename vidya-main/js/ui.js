/* ============================================================
   VIDYA STEM – UI Utilities
   js/ui.js  |  v3.0.0
   ============================================================ */

const ui = (() => {

  /* ── Toast notifications ── */
  let _toastTimer = null;
  function toast(msg, type = 'info') {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.className = `toast toast--${type} toast--show`;
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => el.classList.remove('toast--show'), 3000);
  }

  /* ── Loading overlay ── */
  function setLoading(on, msg = 'Loading…') {
    const el = document.getElementById('loading-overlay');
    if (!el) return;
    el.querySelector('.loading-text').textContent = msg;
    el.classList.toggle('visible', on);
  }

  /* ── Format date ── */
  function fmtDate(ts) {
    return new Date(ts).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  }

  /* ── Format INR ── */
  function fmtINR(n) {
    return '₹' + Number(n).toLocaleString('en-IN');
  }

  /* ── Relative time (e.g. "2h ago", "Just now") ── */
  function timeAgo(ts) {
    const sec = Math.floor((Date.now() - ts) / 1000);
    if (sec < 60)  return 'Just now';
    if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
    if (sec < 2592000) return `${Math.floor(sec / 86400)}d ago`;
    return fmtDate(ts);
  }

  /* ── Confirm dialog ── */
  function confirm(msg, cb) {
    const el = document.getElementById('confirm-dialog');
    if (!el) { if (window.confirm(msg)) cb(); return; }
    el.querySelector('.confirm-msg').textContent = msg;
    el.classList.add('visible');
    el.querySelector('.btn-confirm-ok').onclick = () => {
      el.classList.remove('visible'); cb();
    };
    el.querySelector('.btn-confirm-cancel').onclick = () => {
      el.classList.remove('visible');
    };
  }

  /* ── Render status badge ── */
  function statusBadge(status) {
    const map = {
      'Well Present': ['badge--present', 'fa-circle-check', 'Present'],
      'Broken':       ['badge--broken',  'fa-circle-exclamation', 'Broken'],
      'Missing':      ['badge--missing', 'fa-circle-xmark', 'Missing']
    };
    const [cls, icon, label] = map[status] || ['badge--info', 'fa-circle-info', status];
    return `<span class="status-badge ${cls}"><i class="fa-solid ${icon}"></i> ${label}</span>`;
  }

  return { toast, setLoading, fmtDate, fmtINR, timeAgo, confirm, statusBadge };
})();
