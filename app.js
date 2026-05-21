
const STORAGE_KEY = 'decix_id_v2';
const $ = (s) => document.querySelector(s);

let data = [];

// === FIX escape ===
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>');
}

// === COPY BUTTON ===
function copyIpButton(ip) {
  const b = document.createElement('button');
  b.textContent = '📋';
  b.onclick = () => {
    if (!ip) return;
    navigator.clipboard.writeText(ip)
      .then(() => {
        b.textContent = '✔';
        setTimeout(() => b.textContent = '📋', 800);
      });
  };
  return b;
}

// === LINK CHIP ===
function createLinkChip(name, url) {
  const a = document.createElement('a');
  if (url) {
    a.href = url;
    a.target = "_blank";
  } else {
    a.className = "chip disabled";
    return a;
  }

  a.className = "chip";
  a.textContent = name;
  return a;
}

// === RENDER SIMPLE ===
function renderRows() {
  const tbody = document.querySelector("#tbl tbody");
  tbody.innerHTML = "";

  data.forEach(r => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
<td>${r.company}</td>
<td>${r.asn}</td>
<td>${r.ip_jkt || ''}</td>
<td>${r.ip_ase || ''}</td>
<td>${r.ip_maps || ''}</td>
`;

    // add copy button
    tr.children[2].appendChild(copyIpButton(r.ip_jkt));
    tr.children[3].appendChild(copyIpButton(r.ip_ase));
    tr.children[4].appendChild(copyIpButton(r.ip_maps));

    tbody.appendChild(tr);
  });
}

// === INIT ===
window.addEventListener("DOMContentLoaded", () => {
  console.log("JS OK ✅");
});
``
