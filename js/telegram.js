/* ============================================================
   VIDYA STEM – Telegram Module
   js/telegram.js  |  v3.0.0

   Sends compact audit summaries to Telegram.
   Payload is kept tiny: emoji table, no full item names.
   ============================================================ */

const telegramBot = (() => {

  function _cfg() { return APP_CONFIG.telegram; }

  /* ── Format a compact message ── */
  function buildMessage(meta, results) {
    const d = new Date(meta.ts);
    const dateStr = d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });

    let present = 0;
    let broken  = 0;
    let missing = 0;
    let total   = 0;

    results.forEach(r => {
      const matchWell = r.status.match(/^(\d+)\s+(?:Well\s+)?Present$/);
      const matchSplit = r.status.match(/^(\d+)\s+Present,\s+(\d+)\s+(Broken|Missing)$/);
      const matchAll = r.status.match(/^(\d+)\s+(Broken|Missing)$/);

      if (matchWell) {
        const q = parseInt(matchWell[1]);
        present += q;
        total += q;
      } else if (matchSplit) {
        const pq = parseInt(matchSplit[1]);
        const aq = parseInt(matchSplit[2]);
        const type = matchSplit[3];
        present += pq;
        if (type === 'Broken') broken += aq;
        else if (type === 'Missing') missing += aq;
        total += (pq + aq);
      } else if (matchAll) {
        const aq = parseInt(matchAll[1]);
        const type = matchAll[2];
        if (type === 'Broken') broken += aq;
        else if (type === 'Missing') missing += aq;
        total += aq;
      } else {
        if (r.status === 'Well Present' || r.status === 'Present') present++;
        else if (r.status === 'Broken') broken++;
        else if (r.status === 'Missing') missing++;
        total++;
      }
    });

    // Compact lines only for non-present items
    const issues = results
      .filter(r => r.status !== 'Well Present' && r.status !== 'Present' && !r.status.endsWith('Well Present') && !r.status.endsWith(' Present'))
      .map(r => {
        const icon = r.status.includes('Broken') ? '🟡' : '🔴';
        return `  ${icon} ${r.code}: *${r.status}*`;
      })
      .join('\n');

    const pct = total ? Math.round((present / total) * 100) : 0;

    return [
      `📋 *AUDIT REPORT*`,
      `🏫 ${meta.school || meta.user} — ${meta.labName}`,
      meta.teacher ? `👨‍🏫 Teacher: *${meta.teacher}*` : '',
      `🕐 ${dateStr}`,
      ``,
      `✅ Present Pieces: ${present}/${total} (${pct}%)`,
      `🟡 Broken Pieces:  ${broken}`,
      `🔴 Missing Pieces: ${missing}`,
      ``,
      issues ? `*Issues:*\n${issues}` : `*No issues found* 🎉`
    ].filter(Boolean).join('\n');
  }

  /* ── Send via Telegram Bot API ── */
  async function send(text) {
    const cfg = _cfg();
    if (!cfg.enabled || !cfg.botToken || cfg.botToken === 'YOUR_BOT_TOKEN_HERE') {
      console.warn('[Telegram] Not configured – skipping push');
      return { ok: false, reason: 'not_configured' };
    }
    try {
      const r = await fetch(
        `https://api.telegram.org/bot${cfg.botToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: cfg.chatId,
            text,
            parse_mode: 'Markdown',
            disable_web_page_preview: true
          })
        }
      );
      return await r.json();
    } catch (e) {
      console.error('[Telegram] Send error:', e);
      return { ok: false, reason: e.message };
    }
  }

  return {
    pushAudit: async function (meta, results) {
      const msg = buildMessage(meta, results);
      return send(msg);
    }
  };
})();
