
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
