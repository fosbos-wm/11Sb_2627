// Leistungsnachweise: Raum für digitale Leistungsnachweise (wird erst beim Öffnen geladen).
// Lehrkräfte: Aufgabe einstellen (Zeitfenster, Dauer, Fragen, Erwartungshorizont), Bearbeitung beobachten,
//   Abgabe auslösen oder einsammeln, korrigieren (mit optionaler KI-Vorkorrektur), Ergebnis freigeben.
// Schüler:innen: Aufgabe öffnen, bearbeiten (automatisch gespeichert), abgeben, Ergebnis ansehen.
// Sammlungen: lnAufgaben, lnLoesungen (nur Lehrkräfte), lnVersuche, lnKorrekturen (nur Lehrkräfte), lnZeit.
const c = new Proxy({}, { get: (_, k) => window.CampusWP[k] });
const o = (x) => String(x ?? "").replace(/[&<>"']/g, (t) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[t]);

// Adresse der Cloud Function für die KI-Vorkorrektur (siehe functions/README.md). Leer = KI-Knopf ist aus.
const KI_URL = "";

const FAECHER = [
  ["deutsch", "Deutsch"], ["mathematik", "Mathe"], ["englisch", "Englisch"], ["paedagogik", "Pä/Psy"], ["sozialwirtschaft", "SWR"],
  ["geschichte", "Geschichte"], ["chemie", "Chemie"], ["fpa", "fpA"], ["foerder", "Förder"], ["fachuebergreifend", "Übergreifend"],
];
const fachName = (k) => (FAECHER.find((f) => f[0] === k) || [k, k || ""])[1];
// Punkteschlüssel: Prozent ab → Notenpunkte
const SCHLUESSEL = [[96, 15], [91, 14], [86, 13], [81, 12], [76, 11], [71, 10], [66, 9], [61, 8], [56, 7], [51, 6], [46, 5], [41, 4], [34, 3], [27, 2], [20, 1]];
const punkteVon = (p) => (SCHLUESSEL.find(([g]) => p >= g) || [0, 0])[1];

const st = { v: "liste", id: null, ed: null, off: 0, unsubs: [], timer: 0, auto: 0, dirty: false, fertig: false };
const root = () => document.getElementById("lnRoot");
const D = (ts) => (ts?.toDate ? ts.toDate() : ts instanceof Date ? ts : ts ? new Date(ts) : null);
const hm = (d) => (d ? d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : "–");
const dt = (d) => (d ? d.toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "–");
const lokal = (d) => (d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");
const uidv = () => Math.random().toString(36).slice(2, 8);
const jetzt = () => Date.now() + st.off;
const isT = () => c.isTeacher();
const col = (n) => c.collection(c.db, n);
const ref = (n, id) => c.doc(c.db, n, id);
const lesen = async (n, id) => {
  try {
    const s = await c.getDoc(ref(n, id));
    return s.exists() ? { id: s.id, ...s.data() } : null;
  } catch (e) {
    console.warn(n, e.code || e);
    return null;
  }
};

function stopAll() {
  if (st.dirty && st.flush) st.flush();
  st.flush = null;
  st.unsubs.forEach((f) => {
    try {
      f();
    } catch {}
  });
  st.unsubs = [];
  clearInterval(st.timer);
  clearInterval(st.auto);
  st.dirty = false;
}
function zeige(html) {
  const r = root();
  r && (r.innerHTML = html);
}
function fehler(e, text) {
  console.error(text, e);
  c.toast(e?.code === "permission-denied" ? "Dafür fehlt die Berechtigung (Regeln veröffentlicht?)." : text || "Das hat nicht geklappt.");
}
async function syncZeit() {
  try {
    const t0 = Date.now(),
      uid = c.currentUser.uid;
    await c.setDoc(ref("lnZeit", uid), { uid, t: c.serverTimestamp() });
    const s = await c.getDoc(ref("lnZeit", uid)),
      t1 = Date.now();
    const sv = s.data()?.t?.toMillis?.();
    sv && (st.off = sv - (t0 + t1) / 2);
  } catch (e) {
    console.warn("Zeit:", e.code || e);
  }
}
const kopf = (titel, rechts = "", zurueck = true) =>
  `<div class="ln-head"><div>${zurueck ? '<button class="text-button" onclick="ln.liste()">← Alle Aufgaben</button>' : '<div class="kicker">LEISTUNGSNACHWEISE</div>'}<h1>${o(titel)}</h1></div><div class="ln-act">${rechts}</div></div>`;

// ================= Liste =================
async function liste() {
  stopAll();
  st.v = "liste";
  zeige('<p class="ln-leer">Wird geladen …</p>');
  try {
    if (isT()) {
      const [as, vs] = await Promise.all([
        c.getDocs(col("lnAufgaben")).then((s) => s.docs.map((d) => ({ id: d.id, ...d.data() }))),
        c.getDocs(col("lnVersuche")).then((s) => s.docs.map((d) => d.data())),
      ]);
      as.sort((a, b) => (D(b.von)?.getTime() || 0) - (D(a.von)?.getTime() || 0));
      zeige(`${kopf("Leistungsnachweise", '<button class="primary" onclick="ln.neu()">＋ Neue Aufgabe</button>', false)}
 ${
   as.length
     ? `<div class="ln-liste">${as
         .map((a) => {
           const mine = vs.filter((v) => v.aufgabeId === a.id),
             ab = mine.filter((v) => v.status !== "laeuft").length;
           return `<button type="button" class="ln-karte" onclick="ln.beobachten('${a.id}')"><div><b>${o(a.titel)}</b><small>${o(fachName(a.fach))} · ${dt(D(a.von))} bis ${hm(D(a.bis))} · ${a.dauerMin} Min.</small></div>
 <div class="ln-chips"><span class="ln-chip ${a.status === "frei" ? "ln-gruen" : ""}">${a.status === "frei" ? "freigegeben" : "Entwurf"}</span><span class="ln-chip">${ab} abgegeben</span>${a.ergebnisFrei ? '<span class="ln-chip ln-blau">Ergebnis frei</span>' : ""}</div></button>`;
         })
         .join("")}</div>`
     : '<p class="ln-leer">Noch keine Aufgabe. Mit „Neue Aufgabe“ legst du die erste an.</p>'
 }`);
    } else {
      await syncZeit();
      const [as, vs] = await Promise.all([
        c.getDocs(c.query(col("lnAufgaben"), c.where("status", "==", "frei"))).then((s) => s.docs.map((d) => ({ id: d.id, ...d.data() }))),
        c.getDocs(c.query(col("lnVersuche"), c.where("uid", "==", c.currentUser.uid))).then((s) => s.docs.map((d) => d.data())),
      ]);
      as.sort((a, b) => (D(a.von)?.getTime() || 0) - (D(b.von)?.getTime() || 0));
      const n = jetzt();
      zeige(`${kopf("Leistungsnachweise", "", false)}
 ${
   as.length
     ? `<div class="ln-liste">${as
         .map((a) => {
           const v = vs.find((x) => x.aufgabeId === a.id),
             von = D(a.von),
             bis = D(a.bis);
           let s = "";
           if (v) s = v.status === "laeuft" ? "In Bearbeitung" : a.ergebnisFrei && v.ergebnis ? `Ergebnis: ${v.ergebnis.punkte} Punkte` : "Abgegeben";
           else if (n < von) s = "Startet " + dt(von);
           else if (n > bis) s = "Beendet";
           else s = "Jetzt offen bis " + hm(bis);
           const offen = (!v && n >= von && n <= bis) || v;
           return `<button type="button" class="ln-karte ${offen ? "" : "ln-aus"}" ${offen ? `onclick="ln.oeffnen('${a.id}')"` : "disabled"}><div><b>${o(a.titel)}</b><small>${o(fachName(a.fach))} · ${a.dauerMin} Min.</small></div><span class="ln-chip ${v ? "ln-blau" : offen ? "ln-gruen" : ""}">${o(s)}</span></button>`;
         })
         .join("")}</div>`
     : '<p class="ln-leer">Im Moment gibt es keine Aufgabe.</p>'
 }`);
    }
  } catch (e) {
    fehler(e, "Liste konnte nicht geladen werden.");
    zeige('<p class="ln-leer">Konnte nicht geladen werden.</p>');
  }
}

// ================= Lehrkraft: Aufgabe anlegen und bearbeiten =================
function neuLeer() {
  const j = new Date();
  j.setMinutes(0, 0, 0);
  j.setHours(j.getHours() + 1);
  return { titel: "", fach: "deutsch", anleitung: "", hilfsmittel: "Keine Hilfsmittel außer dem, was hier steht.", von: lokal(j), bis: lokal(new Date(j.getTime() + 2 * 3600000)), dauerMin: 45, status: "entwurf", fragen: [{ id: uidv(), text: "", be: 10, erw: "" }] };
}
function editorHtml() {
  const e = st.ed;
  return `${kopf(e.id ? "Aufgabe bearbeiten" : "Neue Aufgabe", '<button class="secondary" onclick="ln.liste()">Abbrechen</button><button class="primary" onclick="ln.speichern()">Speichern</button>')}
 <div class="card ln-form">
  <label>Titel<input id="edTitel" maxlength="120" value="${o(e.titel)}" placeholder="z. B. Kurzarbeit Erziehungsstile"></label>
  <div class="ln-zeile"><label>Fach<select id="edFach">${FAECHER.map(([k, l]) => `<option value="${k}" ${e.fach === k ? "selected" : ""}>${o(l)}</option>`).join("")}</select></label>
   <label>Dauer (Minuten)<input id="edDauer" type="number" min="5" max="240" value="${o(e.dauerMin)}"></label></div>
  <div class="ln-zeile"><label>Öffnet am<input id="edVon" type="datetime-local" value="${o(e.von)}"></label><label>Schließt am (spätestens)<input id="edBis" type="datetime-local" value="${o(e.bis)}"></label></div>
  <p class="ln-hint">Die Zeit läuft pro Person ab dem Start, höchstens bis zum Schließen.</p>
  <label>Anleitung für die Schüler:innen<textarea id="edAnl" rows="3" maxlength="1500">${o(e.anleitung)}</textarea></label>
  <label>Hilfsmittel<input id="edHilf" maxlength="200" value="${o(e.hilfsmittel)}"></label>
 </div>
 <h3>Fragen</h3>
 ${e.fragen
   .map(
     (q, i) => `<div class="card ln-form"><div class="ln-zeile"><b>Frage ${i + 1}</b><label class="ln-be">BE<input data-f="be" data-i="${i}" type="number" min="1" max="100" value="${o(q.be)}"></label><button class="text-button" onclick="ln.frageWeg(${i})">Entfernen</button></div>
  <label>Aufgabentext<textarea data-f="text" data-i="${i}" rows="3" maxlength="2000">${o(q.text)}</textarea></label>
  <label>Erwartungshorizont (nur für Lehrkräfte, Grundlage der KI-Vorkorrektur)<textarea data-f="erw" data-i="${i}" rows="3" maxlength="3000">${o(q.erw)}</textarea></label></div>`,
   )
   .join("")}
 <div class="ln-act"><button class="secondary" onclick="ln.frageNeu()">＋ Frage</button></div>
 <label class="ln-check"><input type="checkbox" id="edFrei" ${e.status === "frei" ? "checked" : ""}> Für Schüler:innen freigeben (sichtbar im Zeitfenster)</label>`;
}
function editorLesen() {
  const e = st.ed,
    v = (id) => document.getElementById(id)?.value ?? "";
  e.titel = v("edTitel");
  e.fach = v("edFach");
  e.dauerMin = Number(v("edDauer")) || 45;
  e.von = v("edVon");
  e.bis = v("edBis");
  e.anleitung = v("edAnl");
  e.hilfsmittel = v("edHilf");
  e.status = document.getElementById("edFrei")?.checked ? "frei" : "entwurf";
  document.querySelectorAll("[data-f]").forEach((el) => {
    const q = e.fragen[Number(el.dataset.i)];
    q && (q[el.dataset.f] = el.dataset.f === "be" ? Number(el.value) || 0 : el.value);
  });
}
function neu() {
  stopAll();
  st.ed = neuLeer();
  zeige(editorHtml());
}
async function bearbeiten(id) {
  stopAll();
  const [a, l] = await Promise.all([lesen("lnAufgaben", id), lesen("lnLoesungen", id)]);
  if (!a) return c.toast("Nicht gefunden.");
  st.ed = { id, titel: a.titel, fach: a.fach, anleitung: a.anleitung || "", hilfsmittel: a.hilfsmittel || "", von: lokal(D(a.von)), bis: lokal(D(a.bis)), dauerMin: a.dauerMin, status: a.status, fragen: (a.fragen || []).map((q) => ({ ...q, erw: l?.erwartung?.[q.id] || "" })) };
  zeige(editorHtml());
}
function frageNeu() {
  editorLesen();
  st.ed.fragen.push({ id: uidv(), text: "", be: 10, erw: "" });
  zeige(editorHtml());
}
function frageWeg(i) {
  editorLesen();
  st.ed.fragen.length > 1 && st.ed.fragen.splice(i, 1);
  zeige(editorHtml());
}
async function speichern() {
  editorLesen();
  const e = st.ed,
    von = new Date(e.von),
    bis = new Date(e.bis);
  if (!e.titel.trim()) return c.toast("Bitte einen Titel eingeben.");
  if (isNaN(von) || isNaN(bis) || bis <= von) return c.toast("Bitte Öffnen und Schließen prüfen.");
  const fragen = e.fragen.filter((q) => q.text.trim());
  if (!fragen.length) return c.toast("Bitte mindestens eine Frage eintragen.");
  const id = e.id || c.doc(col("lnAufgaben")).id,
    gesamtBE = fragen.reduce((s, q) => s + (q.be || 0), 0);
  try {
    await c.setDoc(
      ref("lnAufgaben", id),
      {
        titel: e.titel.trim(), fach: e.fach, anleitung: e.anleitung.trim(), hilfsmittel: e.hilfsmittel.trim(), von, bis, dauerMin: e.dauerMin,
        status: e.status, gesamtBE, fragen: fragen.map((q) => ({ id: q.id, text: q.text.trim(), be: q.be || 1 })),
        createdBy: c.currentUser.uid, updatedAt: c.serverTimestamp(),
      },
      { merge: true },
    );
    await c.setDoc(ref("lnLoesungen", id), { aufgabeId: id, erwartung: Object.fromEntries(fragen.map((q) => [q.id, q.erw || ""])), updatedAt: c.serverTimestamp() });
    c.toast("Gespeichert.");
    beobachten(id);
  } catch (err) {
    fehler(err, "Speichern nicht möglich.");
  }
}

// ================= Lehrkraft: Bearbeitung beobachten =================
async function beobachten(id) {
  stopAll();
  st.v = "beob";
  st.id = id;
  zeige('<p class="ln-leer">Wird geladen …</p>');
  let a = await lesen("lnAufgaben", id),
    schueler = [];
  try {
    schueler = await c.schueler();
  } catch (e) {
    return fehler(e, "Klasse konnte nicht geladen werden.");
  }
  if (!a) return liste();
  let vm = {};
  const zeichne = () => {
    const n = Date.now();
    const rows = schueler
      .map((u) => {
        const v = vm[u.uid];
        let s = '<span class="ln-chip">nicht begonnen</span>',
          akt = "";
        if (v) {
          if (v.status === "laeuft") {
            s = `<span class="ln-chip ln-gelb">arbeitet · bis ${hm(D(v.endsAt))}</span>`;
            akt = `<button class="secondary" onclick="ln.plus('${o(v.id)}',5)">+5 Min.</button><button class="secondary" onclick="ln.einsammeln('${o(v.id)}')">Einsammeln</button>`;
          } else {
            s = `<span class="ln-chip ln-gruen">${v.abgabeArt === "eingesammelt" ? "eingesammelt" : "abgegeben"} ${hm(D(v.abgabeAm))}</span>`;
            akt = `<button class="primary" onclick="ln.korrektur('${o(v.id)}')">Korrigieren</button>`;
          }
        }
        return `<div class="ln-tr"><span><b>${o(u.displayName || "Schüler:in")}</b></span><span>${s}</span><span class="ln-akt">${akt}</span></div>`;
      })
      .join("");
    const laeuft = Object.values(vm).filter((v) => v.status === "laeuft").length,
      fertig = Object.values(vm).filter((v) => v.status !== "laeuft").length;
    zeige(`${kopf(a.titel, `<button class="secondary" onclick="ln.bearbeiten('${id}')">Bearbeiten</button>`)}
 <div class="card"><div class="ln-info"><span>${o(fachName(a.fach))}</span><span>${dt(D(a.von))} bis ${hm(D(a.bis))}</span><span>${a.dauerMin} Min.</span><span class="ln-chip ${a.status === "frei" ? "ln-gruen" : ""}">${a.status === "frei" ? "freigegeben" : "Entwurf"}</span>
  <b>${laeuft} arbeiten · ${fertig} abgegeben · ${Math.max(0, schueler.length - laeuft - fertig)} offen</b></div>
  <div class="ln-act">
   ${a.status !== "frei" ? `<button class="primary" onclick="ln.frei('${id}',true)">Freigeben</button>` : `<button class="secondary" onclick="ln.frei('${id}',false)">Zurück in Entwurf</button>`}
   <button class="secondary" onclick="ln.aufruf('${id}')" title="Alle Geräte geben automatisch ab">Abgabe auslösen</button>
   <button class="secondary" onclick="ln.alleEinsammeln('${id}')" title="Nur für Geräte, die nicht reagiert haben">Rest einsammeln</button>
   <button class="${a.ergebnisFrei ? "secondary" : "primary"}" onclick="ln.ergebnisse('${id}')">${a.ergebnisFrei ? "Ergebnisse aktualisieren" : "Ergebnisse freigeben"}</button>
  </div></div>
 <div class="card ln-tab">${rows || '<p class="ln-leer">Keine Schüler:innen.</p>'}</div>
 <p class="ln-ds">Die Antworten sehen nur die Person selbst und Lehrkräfte.</p>`);
  };
  st.unsubs.push(
    c.onSnapshot(c.query(col("lnVersuche"), c.where("aufgabeId", "==", id)), (s) => {
      vm = {};
      s.docs.forEach((d) => (vm[d.data().uid] = { id: d.id, ...d.data() }));
      zeichne();
    }, (e) => fehler(e, "Live-Ansicht nicht möglich.")),
    c.onSnapshot(ref("lnAufgaben", id), (s) => {
      s.exists() && ((a = { id, ...s.data() }), zeichne());
    }),
  );
}
const upd = (n, id, d) => c.updateDoc(ref(n, id), { ...d, updatedAt: c.serverTimestamp() });
async function frei(id, an) {
  try {
    await upd("lnAufgaben", id, { status: an ? "frei" : "entwurf" });
  } catch (e) {
    fehler(e, "Nicht möglich.");
  }
}
async function aufruf(id) {
  if (!confirm("Alle Geräte werden aufgefordert, jetzt abzugeben. Fortfahren?")) return;
  try {
    await upd("lnAufgaben", id, { abgabeAufruf: c.serverTimestamp() });
    c.toast("Abgabe ausgelöst. Nach etwa einer Minute kannst du den Rest einsammeln.");
  } catch (e) {
    fehler(e, "Nicht möglich.");
  }
}
async function einsammeln(vid) {
  try {
    await upd("lnVersuche", vid, { status: "eingesammelt", abgabeAm: c.serverTimestamp(), abgabeArt: "eingesammelt" });
  } catch (e) {
    fehler(e, "Nicht möglich.");
  }
}
async function alleEinsammeln(id) {
  try {
    const s = await c.getDocs(c.query(col("lnVersuche"), c.where("aufgabeId", "==", id)));
    const offen = s.docs.filter((d) => d.data().status === "laeuft");
    if (!offen.length) return c.toast("Es arbeitet niemand mehr.");
    if (!confirm(`${offen.length} Person(en) arbeiten noch. Jetzt einsammeln?`)) return;
    await Promise.all(offen.map((d) => einsammeln(d.id)));
  } catch (e) {
    fehler(e, "Nicht möglich.");
  }
}
async function plus(vid, min) {
  try {
    const v = await lesen("lnVersuche", vid),
      e = D(v.endsAt);
    await upd("lnVersuche", vid, { endsAt: new Date(e.getTime() + min * 60000), extraMin: (v.extraMin || 0) + min });
    c.toast(`+${min} Minuten`);
  } catch (e) {
    fehler(e, "Nicht möglich.");
  }
}

// ================= Lehrkraft: Korrektur =================
async function korrektur(vid) {
  stopAll();
  st.v = "korr";
  zeige('<p class="ln-leer">Wird geladen …</p>');
  const v = await lesen("lnVersuche", vid);
  if (!v) return c.toast("Nicht gefunden.");
  const [a, l, k] = await Promise.all([lesen("lnAufgaben", v.aufgabeId), lesen("lnLoesungen", v.aufgabeId), lesen("lnKorrekturen", vid)]);
  const kk = k || { korrektur: {}, ki: null, gesamtKommentar: "" };
  st.k = { vid, v, a, l, kk };
  korrHtml();
}
function korrHtml() {
  const { vid, v, a, l, kk } = st.k;
  const ki = kk.ki?.ergebnisse || {};
  zeige(`${kopf("Korrektur", `${KI_URL ? '<button class="secondary" onclick="ln.kiStart()">KI-Vorkorrektur</button>' : ""}<button class="primary" onclick="ln.korrSpeichern(true)">Fertig speichern</button>`)}
 <div class="ln-sub"><b>${o(a.titel)}</b> · ${o(v.pseudo || "")} · abgegeben ${dt(D(v.abgabeAm))} (${v.abgabeArt === "eingesammelt" ? "eingesammelt" : v.abgabeArt === "zeit" ? "Zeit abgelaufen" : v.abgabeArt === "aufruf" ? "auf Aufruf" : "selbst"})</div>
 ${(a.fragen || [])
   .map((q, i) => {
     const kq = kk.korrektur?.[q.id] || {},
       kiq = ki[q.id];
     return `<div class="card ln-frage ln-form"><div class="ln-zeile"><b>Frage ${i + 1}</b><span class="ln-chip">${q.be} BE</span></div>
  <p class="ln-ftext">${o(q.text)}</p>
  <div class="ln-antwort"><small>Antwort</small><div>${o(v.antworten?.[q.id] || "") || "<i>keine Antwort</i>"}</div></div>
  ${l?.erwartung?.[q.id] ? `<details><summary>Erwartungshorizont</summary><div class="ln-erw">${o(l.erwartung[q.id])}</div></details>` : ""}
  ${kiq ? `<div class="ln-ki"><b>KI-Vorschlag: ${o(kiq.be)} von ${q.be} BE</b><p>${o(kiq.begruendung)}</p><button class="secondary" onclick="ln.kiUebernehmen('${q.id}')">Übernehmen</button></div>` : ""}
  <div class="ln-zeile"><label class="ln-be">BE<input data-q="${q.id}" data-f="be" type="number" min="0" max="${q.be}" step="0.5" value="${o(kq.be ?? "")}" oninput="ln.summe()"></label>
   <label class="ln-wide">Kommentar<input data-q="${q.id}" data-f="kommentar" maxlength="400" value="${o(kq.kommentar || "")}"></label></div></div>`;
   })
   .join("")}
 <div class="card ln-form"><label>Gesamtrückmeldung<textarea id="kkGes" rows="3" maxlength="1000">${o(kk.gesamtKommentar || "")}</textarea></label>
  <div class="ln-summe" id="kkSumme"></div></div>`);
  summe();
}
function korrLesen() {
  const kk = st.k.kk;
  kk.korrektur = {};
  document.querySelectorAll("[data-q]").forEach((el) => {
    const q = (kk.korrektur[el.dataset.q] = kk.korrektur[el.dataset.q] || {});
    q[el.dataset.f] = el.dataset.f === "be" ? (el.value === "" ? null : Number(el.value)) : el.value;
  });
  kk.gesamtKommentar = document.getElementById("kkGes")?.value || "";
}
function berechne() {
  const { a, kk } = st.k,
    max = a.gesamtBE || 1,
    be = (a.fragen || []).reduce((s, q) => s + (Number(kk.korrektur?.[q.id]?.be) || 0), 0),
    pr = Math.round((be / max) * 1000) / 10;
  return { be, max, pr, punkte: punkteVon(pr) };
}
function summe() {
  korrLesen();
  const r = berechne(),
    el = document.getElementById("kkSumme");
  el && (el.innerHTML = `<b>${r.be} von ${r.max} BE</b> · ${String(r.pr).replace(".", ",")} % · <b>${r.punkte} Punkte</b>`);
}
function kiUebernehmen(qid) {
  const kiq = st.k.kk.ki?.ergebnisse?.[qid];
  if (!kiq) return;
  const be = document.querySelector(`[data-q="${qid}"][data-f="be"]`),
    ko = document.querySelector(`[data-q="${qid}"][data-f="kommentar"]`);
  be && (be.value = kiq.be);
  ko && !ko.value && (ko.value = String(kiq.begruendung || "").slice(0, 400));
  summe();
}
async function korrSpeichern(fertig) {
  korrLesen();
  const { vid, v, kk } = st.k,
    r = berechne();
  try {
    await c.setDoc(ref("lnKorrekturen", vid), { aufgabeId: v.aufgabeId, uid: v.uid, korrektur: kk.korrektur, gesamtKommentar: kk.gesamtKommentar, gesamtBE: r.be, punkte: r.punkte, status: fertig ? "fertig" : "entwurf", ki: kk.ki || null, updatedAt: c.serverTimestamp() }, { merge: true });
    c.toast("Gespeichert.");
    fertig && beobachten(v.aufgabeId);
  } catch (e) {
    fehler(e, "Speichern nicht möglich.");
  }
}
async function kiStart() {
  if (!KI_URL) return c.toast("Die KI-Vorkorrektur ist noch nicht eingerichtet.");
  korrLesen();
  const { v, a, l, kk } = st.k;
  if (!confirm("Die Antworten werden ohne Namen an den KI-Dienst gesendet. Fortfahren?")) return;
  c.toast("KI korrigiert …");
  try {
    const token = await c.currentUser.getIdToken(),
      res = await fetch(KI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ titel: a.titel, fach: fachName(a.fach), fragen: (a.fragen || []).map((q) => ({ id: q.id, text: q.text, be: q.be, erwartung: l?.erwartung?.[q.id] || "", antwort: v.antworten?.[q.id] || "" })) }),
      });
    if (!res.ok) throw new Error("KI-Dienst: " + res.status);
    const j = await res.json();
    kk.ki = { ergebnisse: Object.fromEntries((j.ergebnisse || []).map((x) => [x.id, { be: Number(x.be) || 0, begruendung: String(x.begruendung || "").slice(0, 600) }])), am: Date.now() };
    await c.setDoc(ref("lnKorrekturen", st.k.vid), { aufgabeId: v.aufgabeId, uid: v.uid, ki: kk.ki, updatedAt: c.serverTimestamp() }, { merge: true });
    korrHtml();
    c.toast("Vorschlag da. Du entscheidest.");
  } catch (e) {
    console.error(e);
    c.toast(e.message || "KI-Vorkorrektur nicht möglich.");
  }
}
async function ergebnisse(id) {
  try {
    const [ks, a] = await Promise.all([c.getDocs(c.query(col("lnKorrekturen"), c.where("aufgabeId", "==", id))), lesen("lnAufgaben", id)]);
    const fertig = ks.docs.filter((d) => d.data().status === "fertig");
    if (!fertig.length) return c.toast("Noch keine fertig korrigierte Arbeit.");
    if (!confirm(`${fertig.length} Ergebnis(se) für die Schüler:innen sichtbar machen?`)) return;
    await Promise.all(
      fertig.map((d) => {
        const k = d.data();
        return upd("lnVersuche", d.id, {
          ergebnis: { be: Object.fromEntries(Object.entries(k.korrektur || {}).map(([q, x]) => [q, x.be ?? 0])), kommentare: Object.fromEntries(Object.entries(k.korrektur || {}).map(([q, x]) => [q, x.kommentar || ""])), gesamtBE: k.gesamtBE, maxBE: a.gesamtBE, punkte: k.punkte, gesamtKommentar: k.gesamtKommentar || "" },
        });
      }),
    );
    await upd("lnAufgaben", id, { ergebnisFrei: true });
    c.toast("Ergebnisse freigegeben.");
  } catch (e) {
    fehler(e, "Nicht möglich.");
  }
}

// ================= Schüler:in: öffnen, bearbeiten, abgeben =================
async function oeffnen(aid) {
  stopAll();
  await syncZeit();
  const uid = c.currentUser.uid,
    vid = aid + "_" + uid,
    [a, v] = await Promise.all([lesen("lnAufgaben", aid), lesen("lnVersuche", vid)]);
  if (!a) return liste();
  if (v) return v.status === "laeuft" ? bearbeitenS(a, v) : fertigS(a, v);
  const n = jetzt();
  if (n < D(a.von) || n > D(a.bis)) return c.toast("Die Aufgabe ist gerade nicht offen.");
  const ende = Math.min(n + a.dauerMin * 60000, D(a.bis).getTime());
  zeige(`${kopf(a.titel)}<div class="card ln-form"><p><b>${o(fachName(a.fach))}</b> · ${a.dauerMin} Minuten · spätestens bis ${hm(D(a.bis))} Uhr</p>
 ${a.anleitung ? `<p class="ln-ftext">${o(a.anleitung)}</p>` : ""}${a.hilfsmittel ? `<p><b>Hilfsmittel:</b> ${o(a.hilfsmittel)}</p>` : ""}
 <p class="ln-hint">Mit „Starten“ läuft deine Zeit. Dein Text wird automatisch gespeichert. Du kannst vor Ablauf selbst abgeben.</p>
 <div class="ln-act"><button class="secondary" onclick="ln.liste()">Zurück</button><button class="primary" onclick="ln.starten('${aid}')">Starten</button></div></div>`);
  st.ende = ende;
}
async function starten(aid) {
  const a = await lesen("lnAufgaben", aid),
    uid = c.currentUser.uid,
    n = jetzt(),
    ende = Math.min(n + a.dauerMin * 60000, D(a.bis).getTime());
  try {
    await c.setDoc(ref("lnVersuche", aid + "_" + uid), { uid, pseudo: c.profile?.pseudonym || c.profile?.displayName || "", aufgabeId: aid, status: "laeuft", startedAt: c.serverTimestamp(), endsAt: new Date(ende), antworten: {}, updatedAt: c.serverTimestamp() });
    oeffnen(aid);
  } catch (e) {
    fehler(e, "Start nicht möglich. Ist die Aufgabe noch offen?");
  }
}
function bearbeitenS(a, v) {
  const vid = v.id;
  let ende = D(v.endsAt).getTime(),
    aufrufSeit = D(a.abgabeAufruf)?.getTime() || 0,
    gesendet = false;
  st.dirty = false;
  zeige(`<div class="ln-bar"><b>${o(a.titel)}</b><span id="lnTimer" class="ln-timer">–</span></div>
 <p class="ln-save" id="lnSave">Noch nichts geändert</p>
 ${(a.fragen || []).map((q, i) => `<div class="card ln-frage"><div class="ln-zeile"><b>Frage ${i + 1}</b><span class="ln-chip">${q.be} BE</span></div><p class="ln-ftext">${o(q.text)}</p>
  <textarea class="ln-ta" data-q="${q.id}" rows="7" maxlength="8000" placeholder="Deine Antwort …">${o(v.antworten?.[q.id] || "")}</textarea></div>`).join("")}
 <div class="ln-act"><button class="primary" onclick="ln.abgeben()">Abgeben</button></div>`);
  const antworten = () => Object.fromEntries([...document.querySelectorAll(".ln-ta")].map((t) => [t.dataset.q, t.value]));
  document.querySelectorAll(".ln-ta").forEach((t) => t.addEventListener("input", () => ((st.dirty = true), (document.getElementById("lnSave").textContent = "Wird gespeichert …"))));
  const sichern = async () => {
    if (!st.dirty || gesendet) return;
    st.dirty = false;
    try {
      await c.updateDoc(ref("lnVersuche", vid), { antworten: antworten(), updatedAt: c.serverTimestamp() });
      const el = document.getElementById("lnSave");
      el && (el.textContent = "Gespeichert " + hm(new Date(jetzt())));
    } catch (e) {
      st.dirty = true;
      const el = document.getElementById("lnSave");
      el && (el.textContent = "Speichern gerade nicht möglich – bitte Verbindung prüfen");
    }
  };
  const senden = async (art) => {
    if (gesendet) return;
    gesendet = true;
    try {
      await c.updateDoc(ref("lnVersuche", vid), { antworten: antworten(), status: "abgegeben", abgabeAm: c.serverTimestamp(), abgabeArt: art, updatedAt: c.serverTimestamp() });
      stopAll();
      oeffnen(a.id);
    } catch (e) {
      gesendet = false;
      fehler(e, "Abgabe nicht möglich. Bitte erneut versuchen.");
    }
  };
  st.abgeben = () => confirm("Jetzt abgeben? Danach kannst du nichts mehr ändern.") && senden("selbst");
  st.flush = sichern;
  st.auto = setInterval(sichern, 10000);
  st.timer = setInterval(() => {
    const rest = Math.max(0, Math.round((ende - jetzt()) / 1000)),
      el = document.getElementById("lnTimer");
    el && ((el.textContent = String(Math.floor(rest / 60)).padStart(2, "0") + ":" + String(rest % 60).padStart(2, "0")), el.classList.toggle("ln-knapp", rest < 300));
    rest <= 0 && senden("zeit");
  }, 1000);
  st.unsubs.push(
    c.onSnapshot(ref("lnAufgaben", a.id), (s) => {
      const t = D(s.data()?.abgabeAufruf)?.getTime() || 0;
      if (t && t > aufrufSeit) {
        aufrufSeit = t;
        senden("aufruf");
      }
    }),
    c.onSnapshot(ref("lnVersuche", vid), (s) => {
      const d = s.data();
      if (!d) return;
      d.endsAt && (ende = D(d.endsAt).getTime());
      if (d.status !== "laeuft" && !gesendet) {
        gesendet = true;
        stopAll();
        oeffnen(a.id);
      }
    }),
  );
  sichern();
}
function fertigS(a, v) {
  const e = a.ergebnisFrei && v.ergebnis;
  zeige(`${kopf(a.titel)}<div class="card ln-form"><p><b>Abgegeben</b> um ${hm(D(v.abgabeAm))} Uhr.</p>
 ${
   e
     ? `<div class="ln-summe"><b>${e.gesamtBE} von ${e.maxBE} BE · ${e.punkte} Punkte</b></div>${e.gesamtKommentar ? `<p class="ln-ftext">${o(e.gesamtKommentar)}</p>` : ""}`
     : '<p class="ln-hint">Das Ergebnis erscheint hier, sobald deine Lehrkraft es freigibt.</p>'
 }</div>
 ${(a.fragen || []).map((q, i) => `<div class="card ln-frage"><div class="ln-zeile"><b>Frage ${i + 1}</b>${e ? `<span class="ln-chip ln-blau">${o(e.be?.[q.id] ?? 0)} / ${q.be} BE</span>` : `<span class="ln-chip">${q.be} BE</span>`}</div>
  <p class="ln-ftext">${o(q.text)}</p><div class="ln-antwort"><small>Deine Antwort</small><div>${o(v.antworten?.[q.id] || "") || "<i>keine Antwort</i>"}</div></div>${e?.kommentare?.[q.id] ? `<p class="ln-kom">${o(e.kommentare[q.id])}</p>` : ""}</div>`).join("")}`);
}

window.ln = { liste, neu, bearbeiten, frageNeu, frageWeg, speichern, beobachten, frei, aufruf, einsammeln, alleEinsammeln, plus, korrektur, summe, kiUebernehmen, korrSpeichern: korrSpeichern, kiStart, ergebnisse, oeffnen, starten, abgeben: () => st.abgeben?.() };
export async function lnRender() {
  setTimeout(liste, 0);
  return '<div class="ln"><div id="lnRoot"></div></div>';
}
