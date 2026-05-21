
/* ============================
   DE-CIX Indonesia · global.js (FINAL – Opsi B, fixed empty links)
   ============================ */
const STORAGE_KEY = 'decix_global_v2';
const $ = (s) => document.querySelector(s);
let data = [];

// ---------- Utils ----------
function escapeHtml(s){
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;');
}

/**
 * Anggap nilai berikut sebagai "kosong":
 *   -, —, #, N/A (case-insensitive), string kosong/whitespace
 *   Kembalikan null jika kosong; selain itu kembalikan string yang di-trim.
 */
function sanitizeLink(url) {
  if (url == null) return null;
  const u = String(url).trim();
  if (!u) return null;
  const low = u.toLowerCase();
  if (u === '-' || u === '—' || u === '#') return null;
  if (low === 'n/a' || low === 'na' || low === 'none') return null;
  return u;
}

/**
 * Opsi B: link Zabbix publik harus melalui /zabbix/
 * - Jika URL dari mon-backend.* → rewrite ke /zabbix/...
 * - Jika URL sudah berupa absolute http(s) non-backend → biarkan
 * - Jika URL diawali "/" → biarkan
 * - Jika bukan pola di atas → null (anggap invalid)
 */
function toProxy(url) {
  const u = sanitizeLink(url);
  if (!u) return null;
  // Absolute http(s) → pakai apa adanya (termasuk mon-backend.de-cix.services)
  if (/^https?:\/\//i.test(u)) return u;
  // Relative root → valid
  if (u.startsWith('/')) return u;
  // Selain itu → invalid
  return null;
}

// ---------- Render ----------
function createLinkChip(kind, url) {
  // validUrl = benar-benar URL yang bisa dikunjungi
  const validUrl = toProxy(url);

  const el = document.createElement(validUrl ? 'a' : 'span');
  el.className = 'chip' + (!validUrl ? ' disabled' : '');
  if (validUrl) {
    el.href = validUrl;
    el.target = '_blank';
    el.rel = 'noopener';
  } else {
    el.setAttribute('aria-disabled', 'true');
  }

  const label = document.createElement('span');
  label.className = 'kind';
  label.textContent = kind;
  el.appendChild(label);

  if (validUrl) {
    const btn = document.createElement('button');
    btn.className='copy'; btn.title='Copy URL'; btn.textContent='📋';
    btn.addEventListener('click', (e)=>{
      e.preventDefault(); e.stopPropagation();
      (navigator.clipboard?.writeText(validUrl) || Promise.reject()).then(
        ()=>{ btn.textContent='✔'; setTimeout(()=>btn.textContent='📋',800); },
        ()=>{ window.prompt('Copy URL', validUrl); }
      );
    });
    el.appendChild(btn);
  } else {
    const dash=document.createElement('span');
    dash.textContent=' —';
    el.appendChild(dash);
  }
  return el;
}

function copyIpButton(ip){
  const b=document.createElement('button');
  b.className='btn-xs'; b.textContent='📋'; b.title='Copy IP';
  if(!ip){ b.disabled=true; b.style.opacity=.45; }
  b.addEventListener('click', ()=>{
    if(!ip) return;
    (navigator.clipboard?.writeText(ip) || Promise.reject()).then(
      ()=>{ b.textContent='✔'; setTimeout(()=>b.textContent='📋',800); },
      ()=>{ window.prompt('Copy IP', ip); }
    );
  });
  return b;
}

function renderRows(){
  const q = ($('#q')?.value || '').trim().toLowerCase();
  const tokens = q.split(/\s+/).filter(Boolean);

  const filtered = data.filter(row => {
    if (!tokens.length) return true;
    return tokens.every(t=>{
      if (t.startsWith('asn:')) return String(row.asn||'').toLowerCase().includes(t.slice(4));
      if (t.startsWith('has:')){
        const key=t.slice(4).toUpperCase();
        if (key==='IPJKT') return !!row.ip_jkt;
        if (key==='IPASE') return !!row.ip_ase;
        return !!row.links[key];
      }
      if (t.startsWith('ip:')){
        const qip=t.slice(3);
        return (row.ip_jkt||'').includes(qip) || (row.ip_ase||'').includes(qip);
      }
      const hay=`${row.company} ${row.asn||''} ${row.port||''} ${row.ip_jkt||''} ${row.ip_ase||''}`.toLowerCase();
      return hay.includes(t);
    });
  });

  const tbody = document.querySelector('#tbl tbody'); if (!tbody) return;
  tbody.innerHTML = '';

  filtered.forEach(row=>{
    const tr=document.createElement('tr');

    const tdNo=document.createElement('td'); tdNo.className='hide-md'; tdNo.textContent=row.no ?? '';

    const tdCo=document.createElement('td');
    tdCo.innerHTML = `<div style="font-weight:700">${escapeHtml(row.company)}</div>`;

    const tdAsn=document.createElement('td'); tdAsn.textContent=row.asn||'';
    const tdPrt=document.createElement('td'); tdPrt.className='hide-md'; tdPrt.textContent=row.port||'';

    const tdLinks=document.createElement('td');
    const wrap=document.createElement('div'); wrap.className='links';
    wrap.appendChild(createLinkChip('ACCESS', row.links.ACCESS));
    wrap.appendChild(createLinkChip('JKT', row.links.JKT));
    wrap.appendChild(createLinkChip('ASEAN', row.links.ASEAN));
    tdLinks.appendChild(wrap);

    const tdJ=document.createElement('td');
    tdJ.innerHTML=row.ip_jkt? `<code>${escapeHtml(row.ip_jkt)}</code>`:'—';
    tdJ.appendChild(copyIpButton(row.ip_jkt));

    const tdA=document.createElement('td');
    tdA.innerHTML=row.ip_ase? `<code>${escapeHtml(row.ip_ase)}</code>`:'—';
    tdA.appendChild(copyIpButton(row.ip_ase));

    tr.append(tdNo, tdCo, tdAsn, tdPrt, tdLinks, tdJ, tdA);
    tbody.appendChild(tr);
  });
}

// ---------- Parser ----------
function detectDelimiter(line){ const cand=[',',';','\t']; let best=',',n=0; for(const d of cand){const m=line.split(d).length; if(m>n){best=d;n=m}} return best; }
function smartSplit(line,d){ const out=[]; let cur=''; let q=false; for(let i=0;i<line.length;i++){ const c=line[i]; if(c=='"'){ if(q && line[i+1]=='"'){ cur+='"'; i++; continue; } q=!q; continue; } if(c===d && !q){ out.push(cur); cur=''; } else cur+=c; } out.push(cur); return out.map(s=>s.trim()); }
function parseCSV(text){
  text=text.replace(/\r\n/g,'\n').replace(/\r/g,'\n');
  const lines=text.split('\n').filter(x=>true);
  while(lines.length && !lines[0].trim()) lines.shift();
  if(!lines.length) return [];
  const headerRaw=lines.shift().replace(/\t/g,' ');
  const d=detectDelimiter(headerRaw);
  const header=smartSplit(headerRaw, d);
  const rows=[]; let buf=''; let inQ=false;
  const push=(ln)=>{
    const qc=(ln.match(/\\"/g)||[]).length;
    inQ = (inQ ? (qc%2===1 ? false : true) : (qc%2===1));
    if(!inQ){
      const parts=smartSplit(ln,d);
      const o={}; header.forEach((h,i)=>o[h]= i<parts.length?parts[i]:'' );
      rows.push(o); buf='';
    }
  };
  for(const raw of lines){ if(buf) buf+='\n'+raw; else buf=raw; push(buf); }
  if(buf && inQ===false){
    const parts=smartSplit(buf,d); const o={};
    header.forEach((h,i)=>o[h]= i<parts.length?parts[i]:'' );
    rows.push(o);
  }
  return rows.filter(r=>Object.values(r).some(v=>String(v||'').trim()!==''));
}

// ---------- Normalize ----------
function cleanIp(ip){
  if(!ip) return null; let s=String(ip).trim();
  if(s==='-'||s==='—') return null;
  s=s.replace(/,/g,'.');
  if(!/^[0-9.]+$/.test(s)){
    const m=s.match(/\d+\.\d+\.\d+\.\d+/); s=m?m[0]:null;
  }
  return s;
}
function normKey(s){ return String(s||'').replace(/\s+/g,' ').trim().toLowerCase(); }
function normalizeRows(rows){
  return rows.map((r,i)=>{
    const obj={}; for (const [k,v] of Object.entries(r)) obj[normKey(k)]=v;

    const L_ACCESS = sanitizeLink(obj['accesss port zabbix link'] || obj['access zabbix link'] || obj['access link']);
    const L_JKT    = sanitizeLink(obj['jkt zabbix link'] || obj['jkt link']);
    const L_ASEAN  = sanitizeLink(obj['asean zabbix link'] || obj['ase zabbix link'] || obj['asean link'] || obj['ase link']);

    return {
      no: obj['no'] || String(i+1),
      company: obj['company'] || '',
      asn: obj['asn'] || '',
      port: obj['access port'] || obj['port'] || '',
      links: {
        // simpan RAW (belum toProxy) — toProxy akan dipanggil saat render chip
        ACCESS: L_ACCESS,
        JKT:    L_JKT,
        ASEAN:  L_ASEAN
      },
      ip_jkt: cleanIp(obj['ip jkt'] || obj['jkt ip']),
      ip_ase: cleanIp(obj['ip asean'] || obj['ip ase'] || obj['ase ip'])
    };
  });
}

// ---------- Save/Load ----------
async function saveServer(){
  try {
    const r = await fetch('/api/global', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({data}) });
    if (!r.ok) throw new Error('HTTP '+r.status);
    alert('Tersimpan ke server.');
  } catch(e){ alert('Gagal save server: '+e.message); }
}
async function loadServer(){
  try {
    const r = await fetch('/api/global');
    if (!r.ok) throw new Error('HTTP '+r.status);
    const js = await r.json(); data = Array.isArray(js.data) ? js.data : [];
    renderRows(); alert('Data server dimuat: '+data.length+' baris.');
  } catch(e){ alert('Gagal load server: '+e.message); }
}
function saveLocal(){
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ts:Date.now(), data})); alert('Tersimpan di browser.'); }
  catch(e){ alert('Gagal save local: '+e.message); }
}
function loadLocal(){
  try {
    const raw=localStorage.getItem(STORAGE_KEY);
    if (!raw){ alert('Belum ada data lokal.'); return; }
    const obj=JSON.parse(raw); data = Array.isArray(obj.data) ? obj.data : [];
    renderRows(); alert('Data lokal dimuat: '+data.length+' baris.');
  } catch(e){ alert('Gagal load local: '+e.message); }
}

// ---------- Wiring ----------
window.addEventListener('DOMContentLoaded', ()=>{
  $('#q')?.addEventListener('input', renderRows);
  $('#btn-save-server')?.addEventListener('click', saveServer);
  $('#btn-load-server')?.addEventListener('click', loadServer);
  $('#btn-save-local')?.addEventListener('click', saveLocal);
  $('#btn-load-local')?.addEventListener('click', loadLocal);

  const fileInput = $('#file');
  fileInput?.addEventListener('change', async (e)=>{
    const f=e.target.files?.[0]; if(!f) return;
    try{
      let text = await f.text(); text = text.replace(/^\ufeff/, '');
      let rows = [];
      if (f.name.toLowerCase().endsWith('.json')) rows = JSON.parse(text);
      else rows = parseCSV(text);
      if(!Array.isArray(rows)) throw new Error('Format harus array of objects / CSV rows');
      data = normalizeRows(rows); renderRows(); alert('Import sukses: '+data.length+' baris.');
    }catch(err){ alert('Gagal import: '+err.message); }
    finally{ fileInput.value=''; }
  });
});
