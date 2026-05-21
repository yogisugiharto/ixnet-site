
const STORAGE_KEY = 'decix_id_v2';
const $ = (s) => document.querySelector(s);

let data = [];

// ===== utils =====
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>');
}

// ===== copy =====
function copyText(val, btn) {
  navigator.clipboard.writeText(val)
    .then(() => {
      btn.textContent = "✔";
      setTimeout(() => btn.textContent = "📋", 800);
    })
    .catch(() => alert(val));
}

// ===== render =====
function renderRows() {
  const tbody = document.querySelector("#tbl tbody");
  tbody.innerHTML = "";

  data.forEach(r => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
<td>${r.company || ''}</td>
<td>${r.asn || ''}</td>
<td>${r.ip_jkt || ''}</td>
<td>${r.ip_ase || ''}</td>
<td>${r.ip_maps || ''}</td>
`;

    // copy buttons
    [r.ip_jkt, r.ip_ase, r.ip_maps].forEach((ip, i) => {
      const btn = document.createElement("button");
      btn.textContent = "📋";
      btn.onclick = () => copyText(ip, btn);
      tr.children[i + 2].appendChild(btn);
    });

    tbody.appendChild(tr);
  });
}

// ===== CSV =====
function parseCSV(text) {
  const lines = text.trim().split('\n');
  const header = lines.shift().split(',');

  return lines.map(line => {
    const cols = line.split(',');
    let obj = {};
    header.forEach((h, i) => obj[h.trim()] = cols[i]?.trim());
    return obj;
  });
}

// ===== normalize =====
function normalize(rows) {
  return rows.map((r,i) => ({
    company: r.Company || '',
    asn: r.ASN || '',
    ip_jkt: r["IP JKT"] || '',
    ip_ase: r["IP ASE"] || '',
    ip_maps: r["IP MAPS"] || ''
  }));
}

// ===== import =====
function handleImport(e) {
  const file = e.target.files[0];
  if (!file) return;

  file.text().then(text => {
    let rows;

    if (file.name.endsWith(".json")) {
      rows = JSON.parse(text);
    } else {
      rows = parseCSV(text);
    }

    data = normalize(rows);
    renderRows();

    alert("Import sukses: " + data.length + " data");
  });
}

// ===== LOCAL STORAGE =====
function saveLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  alert("Saved locally ✅");
}

function loadLocal() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return alert("No data");

  data = JSON.parse(raw);
  renderRows();
}

// ===== INIT =====
window.addEventListener("DOMContentLoaded", () => {

  console.log("APP READY ✅");

  $('#file').addEventListener("change", handleImport);

  $('#btn-save-local').onclick = saveLocal;
  $('#btn-load-local').onclick = loadLocal;

  // server disable (Cloudflare Pages static)
  $('#btn-save-server').onclick = () => alert("Server API tidak tersedia di Pages");
  $('#btn-load-server').onclick = () => alert("Server API tidak tersedia di Pages");

});
