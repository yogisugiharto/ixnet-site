
const $ = (s) => document.querySelector(s);
let data = [];

// ===== CSV parser =====
function parseCSV(text) {
  const lines = text.trim().split("\n");
  const sep = lines[0].includes("\t") ? "\t" : ",";

  const headers = lines.shift().split(sep).map(h => h.trim());

  return lines.map(line => {
    const cols = line.split(sep);
    let obj = {};
    headers.forEach((h, i) => obj[h] = cols[i]?.trim());
    return obj;
  });
}

// ===== normalize =====
function normalize(rows) {
  return rows.map((r, i) => ({
    no: r["No"] || (i + 1),
    company: r["Company"] || "",
    brand: r["Brand / Other Name"] || "",
    asn: r["ASN"] || "",
    port: r["Access Port"] || "",

    links: {
      ACCESS: r["Access Port Zabbix Link"] || "",
      JKT: r["JKT Zabbix Link"] || "",
      ASEAN: r["ASEAN Zabbix Link"] || "",
      MAPS: r["MAPS Zabbix Link"] || ""
    },

    ip_jkt: r["IP JKT"] || "",
    ip_ase: r["IP ASE"] || "",
    ip_maps: r["IP MAPS"] || ""
  }));
}

// ===== copy =====
function copyText(val, btn) {
  if (!val) return;

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

  const q = ($("#q").value || "").toLowerCase();

  const filtered = data.filter(r => {
    if (!q) return true;

    const text = `
      ${r.company}
      ${r.brand}
      ${r.asn}
      ${r.port}
      ${r.ip_jkt}
      ${r.ip_ase}
      ${r.ip_maps}
    `.toLowerCase();

    return text.includes(q);
  });

  filtered.forEach(r => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
<td>${r.no}</td>
<td>${r.company}</td>
<td>${r.brand}</td>
<td>${r.asn}</td>
<td>${r.port}</td>

<td>
  ${r.links.ACCESS ? `<a href="${r.links.ACCESS}" target="_blank">ACCESS</a>` : ""}
  ${r.links.JKT ? `<a href="${r.links.JKT}" target="_blank">JKT</a>` : ""}
  ${r.links.ASEAN ? `<a href="${r.links.ASEAN}" target="_blank">ASEAN</a>` : ""}
  ${r.links.MAPS ? `<a href="${r.links.MAPS}" target="_blank">MAPS</a>` : ""}
</td>

<td>${r.ip_jkt}</td>
<td>${r.ip_ase}</td>
<td>${r.ip_maps}</td>
`;

    // copy buttons
    [r.ip_jkt, r.ip_ase, r.ip_maps].forEach((ip, i) => {
      const btn = document.createElement("button");
      btn.textContent = "📋";
      btn.onclick = () => copyText(ip, btn);

      tr.children[i + 6].appendChild(btn);
    });

    tbody.appendChild(tr);
  });
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

    alert(`Imported ${data.length} rows ✅`);
  });
}

// ===== local storage =====
function saveLocal() {
  localStorage.setItem("data", JSON.stringify(data));
  alert("Saved locally ✅");
}

function loadLocal() {
  const raw = localStorage.getItem("data");
  if (!raw) return alert("No local data");

  data = JSON.parse(raw);
  renderRows();
}

// ===== init =====
window.addEventListener("DOMContentLoaded", () => {

  console.log("APP READY ✅");

  $("#file").addEventListener("change", handleImport);
  $("#q").addEventListener("input", renderRows);

  $("#btn-save-local").onclick = saveLocal;
  $("#btn-load-local").onclick = loadLocal;

  // disable server (Pages static)
  $("#btn-save-server").onclick = () => alert("Server API tidak tersedia di Cloudflare Pages");
  $("#btn-load-server").onclick = () => alert("Server API tidak tersedia di Cloudflare Pages");
});
