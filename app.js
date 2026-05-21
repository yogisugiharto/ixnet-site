
/* =========================
DE-CIX Indonesia · app.js (FIXED)
========================= */

const STORAGE_KEY = 'decix_id_v2';
const $ = (s) => document.querySelector(s);

let data = [];

// ---------- Utils ----------
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function toProxy(url) {
  if (!url) return null;
  const u = String(url).trim();
  return u || null;
}

// ---------- UI ----------
function createLinkChip(kind, url) {
  const a = document.createElement(url ? 'a' : 'span');
  a.className = 'chip' + (!url ? ' disabled' : '');

  if (url) {
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
  }

  const label = document.createElement('span');
  label.className = 'kind';
  label.textContent = kind;
  a.appendChild(label);

  if (url) {
    const btn = document.createElement('button');
    btn.className = 'copy';
    btn.textContent = '📋';

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      (navigator.clipboard?.writeText(url) || Promise.reject())
        .then(() => {
          btn.textContent = '✔';
          setTimeout(() => btn.textContent = '📋', 800);
        })
        .catch(() => window.prompt("Copy URL", url));
    });

    a.appendChild(btn);
  }

  return a;
}

function copyIpButton(ip) {
  const b = document.createElement('button');
  b.textContent = '📋';

  b.addEventListener('click', () => {
    if (!ip) return;

    (navigator.clipboard?.writeText(ip) || Promise.reject())
      .then(() => {
        b.textContent = '✔';
        setTimeout(() => b.textContent = '📋', 800);
      })
      .catch(() => window.prompt("Copy IP", ip));
  });

  return b;
}

// ---------- Render ----------
function renderRows() {
  const q = ($('#q')?.value || '').toLowerCase();
  const tbody = document.querySelector('#tbl tbody');

  if (!tbody) return;
  tbody.innerHTML = '';

  const filtered = data.filter(r => {
    if (!q) return true;

    const text = `${r.company} ${r.brand || ''} ${r.asn || ''} ${r.port || ''} ${r.ip_jkt || ''} ${r.ip_ase || ''} ${r.ip_maps || ''}`.toLowerCase();
    return text.includes(q);
  });

  filtered.forEach(r => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td class="hide-md">${r.no || ''}</td>
      <td>
        <div style="font-weight:700">${escapeHtml(r.company)}</div>
        <div>${escapeHtml(r.brand || '')}</div>
      </td>
      <td class="hide-md">${r.brand || ''}</td>
      <td>${r.asn || ''}</td>
      <td class="hide-md">${r.port || ''}</td>
      <td></td>
      <td>${r.ip_jkt ? `<code>${r.ip_jkt}</code>` : '-'}</td>
      <td>${r.ip_ase ? `<code>${r.ip_ase}</code>` : '-'}</td>
      <td>${r.ip_maps ? `<code>${r.ip_maps}</code>` : '-'}</td>
    `;

    const linksCell = tr.children[5];
    const wrap = document.createElement('div');

    wrap.appendChild(createLinkChip('ACCESS', r.links?.ACCESS));
    wrap.appendChild(createLinkChip('JKT', r.links?.JKT));
    wrap.appendChild(createLinkChip('ASEAN', r.links?.ASEAN));
    wrap.appendChild(createLinkChip('MAPS', r.links?.MAPS));

    linksCell.appendChild(wrap);

    tbody.appendChild(tr);
  });
}

// ---------- CSV ----------
function parseCSV(text) {
  const lines = text.split('\n');
  const header = lines.shift().split(',');

  return lines.map(line => {
    const cols = line.split(',');
    let obj = {};
    header.forEach((h, i) => obj[h.trim()] = cols[i]?.trim());
    return obj;
  });
}

// ---------- Normalize ----------
function normalizeRows(rows) {
  return rows.map((r, i) => ({
    no: r.No || (i + 1),
    company: r.Company || '',
    brand: r.Brand || '',
    asn: r.ASN || '',
    port: r["Access Port"] || '',
    links: {
      ACCESS: r.ACCESS || null,
      JKT: r.JKT || null,
      ASEAN: r.ASEAN || null,
      MAPS: r.MAPS || null
    },
    ip_jkt: r["IP JKT"] || '',
    ip_ase: r["IP ASE"] || '',
    ip_maps: r["IP MAPS"] || ''
  }));
}

// ---------- Save / Load ----------
async function saveServer() {
  try {
    const res = await fetch('/api/indo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    });

    if (!res.ok) throw new Error(res.status);
    alert("Saved to server");
  } catch (err) {
    alert("Save failed: " + err.message);
  }
}

async function loadServer() {
  try {
    const res = await fetch('/api/indo');
    if (!res.ok) throw new Error(res.status);

    const json = await res.json();
    data = json.data || [];
    renderRows();

    alert(`Loaded ${data.length} rows`);
  } catch (err) {
    alert("Load failed: " + err.message);
  }
}

function saveLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  alert("Saved locally");
}

function loadLocal() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) return alert("No local data");

  data = JSON.parse(raw);
  renderRows();
}

// ---------- Init ----------
window.addEventListener('DOMContentLoaded', () => {
  $('#q')?.addEventListener('input', renderRows);
  $('#btn-save-server')?.addEventListener('click', saveServer);
  $('#btn-load-server')?.addEventListener('click', loadServer);
  $('#btn-save-local')?.addEventListener('click', saveLocal);
  $('#btn-load-local')?.addEventListener('click', loadLocal);

  $('#file')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      let text = await file.text();
      let rows;

      if (file.name.endsWith('.json')) {
        rows = JSON.parse(text);
      } else {
        rows = parseCSV(text);
      }

      data = normalizeRows(rows);
      renderRows();

      alert(`Imported ${data.length} rows`);
    } catch (err) {
      alert("Import failed: " + err.message);
    }
  });
});
