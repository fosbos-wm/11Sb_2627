// Lernstände: einfache Übersicht für Lehrkräfte (wird erst beim Öffnen geladen).
// Datenquellen: wpStatus (Zahlen je Woche und Fach, von den Schüler:innen geschrieben)
// und wpNachweise (kurzer Nachweis mit Einschätzung, Satz, Datei; hier schreiben Lehrkräfte die Rückmeldung).
// Der Plan selbst (wpPlan) bleibt privat und wird hier nicht gelesen.
const c = new Proxy({}, { get: (_, k) => window.CampusWP[k] });
const o = (x) => String(x ?? "").replace(/[&<>"']/g, (t) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[t]);

const FAECHER = [
  { k: "deutsch", l: "Deutsch", c: "#2f6fb0" },
  { k: "mathematik", l: "Mathe", c: "#d17a1f" },
  { k: "englisch", l: "Englisch", c: "#8250b8" },
  { k: "paedagogik", l: "Pä/Psy", c: "#1f9a8a" },
  { k: "sozialwirtschaft", l: "SWR", c: "#c2477f" },
  { k: "geschichte", l: "Geschichte", c: "#9a7b2c" },
  { k: "chemie", l: "Chemie", c: "#5e9a38" },
  { k: "fpa", l: "fpA", c: "#5f6f91" },
  { k: "foerder", l: "Förder", c: "#b5573c" },
  { k: "fachuebergreifend", l: "Übergr.", c: "#8a9499" },
];
const fach = (k) => FAECHER.find((f) => f.k === k) || { k, l: k || "?", c: "#8a9499" };
const STUFEN = { g: "gut verstanden", m: "teils", s: "noch unsicher" };
const TAGE_INAKTIV = 7;

const st = { daten: null, nurAuffaellige: false, laden: false };

const iso = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
function montag(d) {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}
function seit(sec) {
  if (!sec) return "noch nie";
  const t = Math.floor((Date.now() / 1000 - sec) / 86400);
  return t <= 0 ? "heute" : t === 1 ? "gestern" : "vor " + t + " Tagen";
}
const minTxt = (m) => (m >= 60 ? String(Math.round(m / 6) / 10).replace(".", ",") + " Std." : Math.round(m) + " Min.");
const datum = (ts) => (ts?.seconds ? new Date(ts.seconds * 1000).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }) : "");

async function holen() {
  const [schueler, status, nachweise] = await Promise.all([
    c.schueler(),
    c.getDocs(c.collection(c.db, "wpStatus")).then((s) => s.docs.map((d) => d.data())),
    c.getDocs(c.collection(c.db, "wpNachweise")).then((s) => s.docs.map((d) => ({ id: d.id, ...d.data() }))),
  ]);
  const ab = iso(montag(new Date(Date.now() - 7 * 86400000))); // aktuelle und vorige Woche
  const jung = status.filter((s) => String(s.woche) >= ab);
  const fachSet = new Set();
  jung.forEach((s) => Object.keys(s.faecher || {}).forEach((k) => fachSet.add(k)));
  nachweise.forEach((n) => n.fach && fachSet.add(n.fach));
  let spalten = FAECHER.filter((f) => fachSet.has(f.k));
  if (!spalten.length) spalten = FAECHER.slice(0, 5);
  const grenze = Date.now() / 1000 - 14 * 86400;
  const zeilen = schueler
    .map((u) => {
      const meine = jung.filter((s) => s.uid === u.uid);
      const nw = nachweise.filter((n) => n.uid === u.uid).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      const zahlen = {};
      meine.forEach((s) =>
        Object.entries(s.faecher || {}).forEach(([k, f]) => {
          const z = zahlen[k] || (zahlen[k] = { gMin: 0, eMin: 0, n: 0, nE: 0 });
          z.gMin += f.gMin || 0;
          z.eMin += f.eMin || 0;
          z.n += f.n || 0;
          z.nE += f.nE || 0;
        }),
      );
      const alle = status.filter((s) => s.uid === u.uid);
      const sec = Math.max(0, ...alle.map((s) => s.updatedAt?.seconds || 0), ...nw.map((n) => n.createdAt?.seconds || 0));
      return { u, nw, zahlen, sec, nw14: nw.filter((n) => (n.createdAt?.seconds || 0) >= grenze).length };
    })
    .sort((a, b) => String(a.u.displayName).localeCompare(String(b.u.displayName), "de"));
  // Ein Fach gilt als „im Gang“, wenn mindestens ein Drittel der Klasse dort etwas eingeplant hat.
  const imGang = new Set(
    spalten.filter((f) => zeilen.filter((z) => z.zahlen[f.k]?.n > 0).length >= Math.max(1, zeilen.length / 3)).map((f) => f.k),
  );
  zeilen.forEach((z) => {
    z.ampel = {};
    spalten.forEach((f) => {
      const x = z.zahlen[f.k],
        letzte = z.nw.find((n) => n.fach === f.k && n.einschaetzung);
      const unsicher = letzte && letzte.einschaetzung === "s" && (letzte.createdAt?.seconds || 0) >= grenze;
      const hatNw = z.nw.some((n) => n.fach === f.k && (n.createdAt?.seconds || 0) >= grenze);
      let s = "none";
      if (x && x.eMin > 0) s = "ok";
      else if (hatNw) s = "ok";
      else if (x && x.n > 0) s = "plan";
      else if (imGang.has(f.k)) s = "leer";
      z.ampel[f.k] = { s, unsicher: !!unsicher, x };
    });
    const inaktiv = !z.sec || Date.now() / 1000 - z.sec > TAGE_INAKTIV * 86400;
    z.auff = inaktiv || spalten.some((f) => z.ampel[f.k].s === "leer" || z.ampel[f.k].unsicher);
    z.inaktiv = inaktiv;
  });
  return { zeilen, spalten };
}

const TIPP = { ok: "etwas erledigt oder abgegeben", plan: "eingeplant, noch nichts erledigt", leer: "nichts eingeplant", none: "kein Thema in den letzten 2 Wochen" };

function tabelle() {
  const { zeilen, spalten } = st.daten,
    liste = st.nurAuffaellige ? zeilen.filter((z) => z.auff) : zeilen,
    auff = zeilen.filter((z) => z.auff).length;
  return `<div class="ls-kopf"><div><b>${zeilen.length}</b> Schüler:innen · <b class="${auff ? "ls-warn" : ""}">${auff}</b> brauchen Aufmerksamkeit</div>
 <label class="ls-filter"><input type="checkbox" ${st.nurAuffaellige ? "checked" : ""} onchange="ls.filter(this.checked)"> nur Auffällige</label></div>
 <div class="ls-tab" style="--sp:${spalten.length}">
  <div class="ls-tr ls-th"><span>Name</span>${spalten.map((f) => `<span style="color:${f.c}">${o(f.l)}</span>`).join("")}<span>zuletzt aktiv</span></div>
  ${
    liste
      .map(
        (z) => `<button type="button" class="ls-tr ls-zeile" onclick="ls.karte('${o(z.u.uid)}')">
   <span class="ls-name">${o(z.u.displayName || "Schüler:in")}${z.nw14 ? ` <small class="ls-nw" title="Nachweise in 14 Tagen">${z.nw14} ✓</small>` : ""}</span>
   ${spalten.map((f) => `<span><i class="ls-p ls-${z.ampel[f.k].s}${z.ampel[f.k].unsicher ? " ls-uns" : ""}" title="${o(TIPP[z.ampel[f.k].s])}${z.ampel[f.k].unsicher ? " · Schüler:in fühlt sich unsicher" : ""}">${z.ampel[f.k].unsicher ? "!" : ""}</i></span>`).join("")}
   <span class="${z.inaktiv ? "ls-warn" : ""}">${seit(z.sec)}</span></button>`,
      )
      .join("") || '<p class="ls-leer">Alle im grünen Bereich.</p>'
  }
 </div>
 <div class="ls-leg"><span><i class="ls-p ls-ok"></i>erledigt</span><span><i class="ls-p ls-plan"></i>eingeplant</span><span><i class="ls-p ls-leer"></i>nichts eingeplant</span><span><i class="ls-p ls-uns">!</i>unsicher</span></div>`;
}

function dateiHtml(n) {
  if (!n.datei) return "";
  const t = String(n.dateiTyp || "");
  if (t.startsWith("audio/") || /\.(m4a|mp3|wav|ogg|aac)$/i.test(n.dateiName || ""))
    return `<audio controls preload="none" src="${o(n.datei)}"></audio>`;
  if (t.startsWith("image/")) return `<a href="${o(n.datei)}" target="_blank" rel="noopener"><img class="ls-bild" src="${o(n.datei)}" alt="Abgabe"></a>`;
  return `<a class="pill" href="${o(n.datei)}" target="_blank" rel="noopener">${o(n.dateiName || "Datei öffnen")} ↗</a>`;
}

function karte(uid) {
  const z = st.daten.zeilen.find((r) => r.u.uid === uid);
  if (!z) return;
  const fz = st.daten.spalten
    .filter((f) => z.zahlen[f.k])
    .map((f) => `<span class="ls-chip" style="--fc:${f.c}">${o(f.l)} ${minTxt(z.zahlen[f.k].eMin)}</span>`)
    .join("");
  c.modal(`<button class="modal-close" onclick="closeModal()">×</button>
 <div class="kicker">LERNSTAND</div><h2>${o(z.u.displayName || "Schüler:in")}</h2>
 <p class="ls-sub">Zuletzt aktiv: ${seit(z.sec)}</p>
 ${fz ? `<h4>Erledigte Lernzeit, letzte 2 Wochen</h4><div class="ls-chips">${fz}</div>` : ""}
 <h4>Nachweise</h4>
 ${
   z.nw.length
     ? z.nw
         .slice(0, 15)
         .map(
           (n) => `<div class="ls-nwk"><div class="ls-nwh"><span class="ls-chip" style="--fc:${fach(n.fach).c}">${o(fach(n.fach).l)}</span><b>${o(n.titel)}</b><small>${datum(n.createdAt)}</small></div>
   <div class="ls-nwb">${n.einschaetzung ? `<span class="ls-e ls-e-${o(n.einschaetzung)}">${o(STUFEN[n.einschaetzung] || "")}</span>` : ""}${n.ergebnis ? `<span class="ls-erg">${o(n.ergebnis)}</span>` : ""}</div>
   ${n.text ? `<p class="ls-satz">„${o(n.text)}“</p>` : ""}${dateiHtml(n)}
   <div class="ls-rm"><input id="rm_${o(n.id)}" maxlength="240" value="${o(n.rueckmeldung || "")}" placeholder="Kurze Rückmeldung an die Person …"><button class="secondary" onclick="ls.rueck('${o(n.id)}')">Senden</button></div></div>`,
         )
         .join("")
     : '<p class="ls-leer">Noch keine Nachweise. Sie entstehen, wenn Schüler:innen wichtige Lernbausteine abschließen.</p>'
 }
 <div class="form-actions"><button class="secondary" onclick="closeModal()">Schließen</button></div>`);
}

async function rueck(id) {
  const el = document.getElementById("rm_" + id),
    t = (el?.value || "").trim().slice(0, 240);
  try {
    await c.updateDoc(c.doc(c.db, "wpNachweise", id), {
      rueckmeldung: t,
      rueckmeldungVon: c.profile?.displayName || "Lehrkraft",
      rueckmeldungAm: c.serverTimestamp(),
      updatedAt: c.serverTimestamp(),
    });
    const n = st.daten.zeilen.flatMap((z) => z.nw).find((x) => x.id === id);
    n && (n.rueckmeldung = t);
    c.toast("Rückmeldung gesendet.");
  } catch (e) {
    console.error(e);
    c.toast("Senden nicht möglich.");
  }
}

async function neuLaden() {
  const root = document.getElementById("lsRoot");
  if (!root) return;
  root.innerHTML = '<p class="ls-leer">Wird geladen …</p>';
  try {
    st.daten = await holen();
    root.innerHTML = tabelle();
  } catch (e) {
    console.error("Lernstände:", e);
    root.innerHTML = `<div class="card"><p>${o(e?.code === "permission-denied" ? "Dafür fehlt die Berechtigung. Bitte die neuen firestore.rules in der Firebase-Konsole veröffentlichen." : e?.message || "Konnte nicht geladen werden.")}</p></div>`;
  }
}

window.ls = {
  filter: (v) => {
    st.nurAuffaellige = !!v;
    const root = document.getElementById("lsRoot");
    root && st.daten && (root.innerHTML = tabelle());
  },
  karte,
  rueck,
  neu: neuLaden,
};

export async function lsRender() {
  if (!c.isTeacher()) return '<div class="card"><p>Diese Seite ist nur für Lehrkräfte.</p></div>';
  setTimeout(neuLaden, 0);
  return `<div class="ls"><div class="ls-head"><div><div class="kicker">LERNSTÄNDE</div><h1>Wie steht die Klasse?</h1></div>
 <button class="secondary" onclick="ls.neu()">Aktualisieren</button></div>
 <div class="card"><div id="lsRoot"></div></div>
 <p class="ls-ds">Du siehst Zahlen und Nachweise. Der Wochenplan der Schüler:innen bleibt privat, außer sie teilen ihn.</p></div>`;
}
