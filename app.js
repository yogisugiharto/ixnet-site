
const $ = (s) => document.querySelector(s);
let data = [];

// ===== CSV parser =====
function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines.shift().split(",");

  return lines.map(line => {
    const cols = line.split(",");
    let obj = {};
    headers.forEach((h, i) => obj[h.trim()] = cols[i]?.trim());
    return obj;
  });
}

// ===== normalize (INI FIX PENTING) =====
function normalize(rows) {
  return rows.map((r, i) => ({
    no: r.No || (i + 1),
    company: r.Company || "",
    brand: r.Brand || "",
    asn: r.ASN || "",
    port: r["Access Port"] || "",
    links: {
      ACCESS: r.ACCESS || "",
      JKT: r.JKT || "",
      ASEAN: r.ASEAN || "",
      MAPS: r.MAPS || ""
    },
    ip_jkt: r["IP JKT"] || "",
    ip_ase: r["IP ASE"] || "",
    ip_maps: r["IP MAPS"] || ""
  }));
}

// ===== render =====
function renderRows() {
  const tbody = document.querySelector("#tbl tbody");
  tbody.innerHTML = "";

  data.forEach(r => {
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

    // copy button
    [r.ip_jkt, r.ip_ase, r.ip_maps].forEach((ip, i) => {
      const btn = document.createElement("button");
      btn.textContent = "📋";
      btn.onclick = () => navigator.clipboard.writeText(ip);

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

    alert("Import sukses ✅");
  });
}

// ===== local =====
function saveLocal() {
  localStorage.setItem("data", JSON.stringify(data));
}

function loadLocal() {
  const d = localStorage.getItem("data");
  if (!d) return alert("Kosong");
  data = JSON.parse(d);
  renderRows();
}

// ===== init =====
window.addEventListener("DOMContentLoaded", () => {
  $("#file").addEventListener("change", handleImport);
  $("#btn-save-local").onclick = saveLocal;
  $("#btn-load-local").onclick = loadLocal;
});
``
