/* ============================================================
   VIDYA STEM – Export Module
   js/export.js  |  v3.0.0

   exportMgr.toImage(auditId)   – saves PNG of audit report
   exportMgr.toExcel(auditId)   – saves CSV (no external lib)
   ============================================================ */

const exportMgr = (() => {

  const STATUS_COLOR = APP_CONFIG.statusColors;

  /* ── Generate audit report HTML canvas via DOM ── */
  function buildReportHTML(expanded, nameMap = {}) {
    const { meta, results } = expanded;
    const d = new Date(meta.ts);
    const dateStr = d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });

    let present = 0;
    let broken  = 0;
    let missing = 0;
    let total   = 0;

    const rows = results.map((r, i) => {
      let isWellPresent = r.status.includes('Well Present') || (r.status.includes('Present') && !r.status.includes('Broken') && !r.status.includes('Missing'));
      let isBroken = r.status.includes('Broken');
      let isMissing = r.status.includes('Missing');

      // Parse quantities if the status represents split numbers, e.g. "8 Present, 2 Broken" or "10 Well Present"
      let itemQty = 1;
      const matchWell = r.status.match(/^(\d+)\s+(?:Well\s+)?Present$/);
      const matchSplit = r.status.match(/^(\d+)\s+Present,\s+(\d+)\s+(Broken|Missing)$/);
      const matchAll = r.status.match(/^(\d+)\s+(Broken|Missing)$/);
 
      if (matchWell) {
        const q = parseInt(matchWell[1]);
        present += q;
        total += q;
        itemQty = q;
      } else if (matchSplit) {
        const pq = parseInt(matchSplit[1]);
        const aq = parseInt(matchSplit[2]);
        const type = matchSplit[3];
        present += pq;
        if (type === 'Broken') broken += aq;
        else if (type === 'Missing') missing += aq;
        total += (pq + aq);
        itemQty = pq + aq;
      } else if (matchAll) {
        const aq = parseInt(matchAll[1]);
        const type = matchAll[2];
        if (type === 'Broken') broken += aq;
        else if (type === 'Missing') missing += aq;
        total += aq;
        itemQty = aq;
      } else {
        // Fallback for non-quantity items
        if (r.status === 'Well Present' || r.status === 'Present') present++;
        else if (r.status === 'Broken') broken++;
        else if (r.status === 'Missing') missing++;
        total++;
      }

      const bg = isMissing ? '#fde8ea'
               : isBroken  ? '#fff3e6'
               : '#e6f9f5';
      const dot = isMissing ? '#e63946'
                : isBroken  ? '#f4a261'
                : '#2a9d8f';

      const itemName = nameMap[r.code] || 'Unknown Item';
      return `<tr style="background:${bg}">
        <td style="padding:6px 12px;color:#555;font-size:12px">${i+1}</td>
        <td style="padding:6px 12px;font-family:monospace;font-size:12px;color:#333">${r.code}</td>
        <td style="padding:6px 12px;font-size:12px;color:#333">${itemName}</td>
        <td style="padding:6px 12px;font-size:13px;color:${dot};font-weight:600">${r.status}</td>
      </tr>`;
    }).join('');

    return `
<div id="export-report" style="
  font-family: 'Segoe UI', sans-serif;
  background: #fff;
  padding: 32px;
  width: 700px;
  border-radius: 16px;
  box-shadow: 0 4px 32px rgba(0,0,0,0.12);
">
  <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;border-bottom:2px solid #f0f0f0;padding-bottom:16px">
    <div style="width:48px;height:48px;background:#2a9d8f;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;font-weight:700">V</div>
    <div>
      <div style="font-size:20px;font-weight:700;color:#1a1a2e">VIDYA STEM</div>
      <div style="font-size:12px;color:#888">Inventory Audit Report</div>
    </div>
    <div style="margin-left:auto;text-align:right">
      <div style="font-size:12px;color:#888">${dateStr}</div>
      <div style="font-size:13px;font-weight:600;color:#333">${meta.school || meta.user}</div>
      ${meta.teacher ? `<div style="font-size:11px;color:#666;font-weight:500;margin-top:2px">Teacher: ${meta.teacher}</div>` : ''}
    </div>
  </div>

  <div style="font-size:16px;font-weight:700;color:#1a1a2e;margin-bottom:12px">${meta.labName}</div>

  <div style="display:flex;gap:12px;margin-bottom:20px">
    <div style="flex:1;background:#e6f9f5;border-radius:10px;padding:12px;text-align:center">
      <div style="font-size:24px;font-weight:700;color:#2a9d8f">${present}</div>
      <div style="font-size:11px;color:#555">Well Present</div>
    </div>
    <div style="flex:1;background:#fff3e6;border-radius:10px;padding:12px;text-align:center">
      <div style="font-size:24px;font-weight:700;color:#f4a261">${broken}</div>
      <div style="font-size:11px;color:#555">Broken</div>
    </div>
    <div style="flex:1;background:#fde8ea;border-radius:10px;padding:12px;text-align:center">
      <div style="font-size:24px;font-weight:700;color:#e63946">${missing}</div>
      <div style="font-size:11px;color:#555">Missing</div>
    </div>
    <div style="flex:1;background:#f5f5f5;border-radius:10px;padding:12px;text-align:center">
      <div style="font-size:24px;font-weight:700;color:#333">${total}</div>
      <div style="font-size:11px;color:#555">Total Pieces</div>
    </div>
  </div>

  <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden">
    <thead>
      <tr style="background:#1a1a2e;color:#fff">
        <th style="padding:8px 12px;font-size:12px;text-align:left;font-weight:500;width:30px">#</th>
        <th style="padding:8px 12px;font-size:12px;text-align:left;font-weight:500;width:120px">Item Code</th>
        <th style="padding:8px 12px;font-size:12px;text-align:left;font-weight:500">Item Name</th>
        <th style="padding:8px 12px;font-size:12px;text-align:left;font-weight:500;width:120px">Status</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div style="margin-top:20px;text-align:center;font-size:11px;color:#bbb">
    Generated by VIDYA STEM Inventory System · ${dateStr}
  </div>
</div>`;
  }

  /* ── PNG export via html2canvas ── */
  async function toImage(auditId) {
    const expanded = dataStore.expandAudit(auditId);
    if (!expanded) return ui.toast('Audit not found', 'error');

    ui.toast('Generating image…', 'info');

    // Retrieve name map dynamically
    const nameMap = await dataStore.getItemNameMap(expanded.meta.lab);

    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1';
    container.innerHTML = buildReportHTML(expanded, nameMap);
    document.body.appendChild(container);

    const el = container.querySelector('#export-report');

    // Use html2canvas if available, else fallback
    if (typeof html2canvas !== 'undefined') {
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#f5f5f5' });
      const link = document.createElement('a');
      link.download = `audit_${expanded.meta.school || expanded.meta.user}_${expanded.meta.labName}_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      ui.toast('Image exported!', 'success');
    } else {
      // Fallback: print
      const w = window.open('', '_blank');
      w.document.write(`<html><body style="margin:0;padding:20px;background:#f0f0f0">${container.innerHTML}</body></html>`);
      w.document.close();
      w.print();
      ui.toast('Opened print dialog', 'info');
    }
    document.body.removeChild(container);
  }

  /* ── CSV export (no external lib) ── */
  async function toExcel(auditId) {
    const expanded = dataStore.expandAudit(auditId);
    if (!expanded) return ui.toast('Audit not found', 'error');

    const { meta, results } = expanded;
    const d = new Date(meta.ts).toLocaleString('en-IN');

    // Retrieve name map dynamically
    const nameMap = await dataStore.getItemNameMap(meta.lab);

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

    const rows = [
      ['VIDYA STEM – Audit Report'],
      ['School', meta.school || meta.user],
      ['Lab', meta.labName],
      ['Date', d],
      ['Teacher', meta.teacher || 'N/A'],
      ['Auditor', meta.user],
      [],
      ['#', 'Item Code', 'Item Name', 'Status'],
      ...results.map((r, i) => [i + 1, r.code, nameMap[r.code] || 'Unknown Item', r.status]),
      [],
      ['Summary (Total Pieces)'],
      ['Total Pieces', total],
      ['Well Present', present],
      ['Broken', broken],
      ['Missing', missing]
    ];

    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `audit_${meta.school || meta.user}_${Date.now()}.csv`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    ui.toast('CSV exported!', 'success');
  }

  return { toImage, toExcel, buildReportHTML };
})();
