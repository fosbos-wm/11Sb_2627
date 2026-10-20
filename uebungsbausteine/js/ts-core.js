/* Teststation – Kern (ohne Server): Hilfsfunktionen. Es werden keine Daten übertragen. */
export const ls = { get(k){try{return localStorage.getItem(k)}catch(e){return null}}, set(k,v){try{localStorage.setItem(k,v)}catch(e){}}, del(k){try{localStorage.removeItem(k)}catch(e){}} };
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
export const fmtTime = s => Math.floor(s / 60) + ":" + String(Math.round(s % 60)).padStart(2, "0");
export const SAFE_DATEI = /^[a-z0-9][a-z0-9\-_.]*\.html(\?[a-z0-9=&\-_.%]*)?$/i;
export function rankSort(a, b) { return (b.punkte - a.punkte) || (a.zuege - b.zuege) || (a.sekunden - b.sekunden); }
export async function loadJson(path) { const r = await fetch(path, { cache: "no-cache" }); if (!r.ok) throw new Error(path); return r.json(); }
export const loadKatalog = () => loadJson("stationen/katalog.json");
/* Ergebniscode: Team-Punkte-Max-Züge-Sekunden-Prüfziffer, z. B. 03-9-11-14-85-2 */
const chk = a => String(a.reduce((s, n) => s + n, 0) % 10);
export function makeCode(r) { const a = [r.team, r.punkte, r.max, r.zuege, r.sekunden].map(n => Math.max(0, Math.round(n))); return String(a[0]).padStart(2, "0") + "-" + a.slice(1).join("-") + "-" + chk(a); }
export function parseCode(s) {
  const p = String(s).trim().split(/[-\s]+/).map(x => x.trim());
  if (p.length !== 6 || p.some(x => !/^\d+$/.test(x))) return null;
  const a = p.slice(0, 5).map(Number);
  if (chk(a) !== p[5] || a[1] > a[2] || a[0] < 1 || a[0] > 30) return null;
  return { team: a[0], punkte: a[1], max: a[2], zuege: a[3], sekunden: a[4] };
}
export async function qrSvg(text, px = 220) {
  const { qrcode } = await import("./qr-local.js");
  const q = qrcode(0, "M"); q.addData(text); q.make();
  const n = q.getModuleCount(), cell = 4; let d = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${(c + 2) * cell} ${(r + 2) * cell}h${cell}v${cell}h-${cell}z`;
  const size = (n + 4) * cell;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${px}" height="${px}" role="img" aria-label="QR-Code zur Übung"><rect width="${size}" height="${size}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}

/* Parameter aus der URL nur übernehmen, wenn der Katalog sie kennt (Schutz vor beliebigen Eingaben) */
export function cleanParams(station, src) {
  const out = {};
  (station.parameter || []).forEach(p => { const v = src.get(p.name); if (v !== null && /^[A-Za-z0-9]{1,6}$/.test(v)) out[p.name] = v; });
  return out;
}
export const cleanId = s => String(s || "").toLowerCase().replace(/[^a-z0-9\-]/g, "").slice(0, 40);

/* Gliederung: Fach (Ordner) > Thema (Unterordner) > Übungen. Reihenfolge wie im Katalog. */
export function gruppiere(kat){
  const fs=[];
  kat.forEach(s=>{
    const fn=s.fach||"Weitere",tn=s.thema||"Allgemein";
    let f=fs.find(x=>x.fach===fn);if(!f){f={fach:fn,themen:[],n:0};fs.push(f)}
    let t=f.themen.find(x=>x.thema===tn);if(!t){t={thema:tn,items:[]};f.themen.push(t)}
    t.items.push(s);f.n++;
  });
  return fs;
}
