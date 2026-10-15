/* =========================================================
   WOCHENPLAN 11Sb – Lernbausteine, Einführungen, Lernstandsgespräche, Buchungen, Klassenteam
   Wird bei Aufruf der Seite #wochenplan nachgeladen.
   Datenschutz: der persönliche Plan (wpPlan) ist privat; Lehrkräfte sehen
   nur Kennzahlen (wpStatus) – den Plan selbst nur, wenn die Person ihn teilt.
   ========================================================= */
const fb=new Proxy({},{get:(_,k)=>window.CampusWP[k]});
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const col=n=>fb.collection(fb.db,n);
const ref=(n,id)=>fb.doc(fb.db,n,id);
const W=(f,v)=>fb.where(f,"==",v);
async function qdocs(n,...c){const s=await fb.getDocs(c.length?fb.query(col(n),...c):col(n));return s.docs.map(d=>({id:d.id,...d.data()}))}
async function gdoc(n,id){try{const s=await fb.getDoc(ref(n,id));return s.exists()?{id:s.id,...s.data()}:null}catch(e){console.warn("wp",n,e.code||e);return null}}
const isT=()=>fb.isTeacher();
const uid=()=>fb.currentUser.uid;
const pseudo=()=>fb.profile?.pseudonym||fb.profile?.displayName||"Schüler:in";
const nid=()=>Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-3);

/* ---------- Stammdaten ---------- */
const FAECHER=[
 {k:"deutsch",l:"Deutsch",c:"#2f6fb0",bg:"#e3f0f9"},
 {k:"mathematik",l:"Mathematik",c:"#d17a1f",bg:"#fbefdb"},
 {k:"englisch",l:"Englisch",c:"#8250b8",bg:"#eee7f7"},
 {k:"paedagogik",l:"Pä/Psy",c:"#1f9a8a",bg:"#e0f2ee"},
 {k:"sozialwirtschaft",l:"SWR",c:"#c2477f",bg:"#f7e5ee"},
 {k:"geschichte",l:"Geschichte",c:"#9a7b2c",bg:"#f6eed7"},
 {k:"chemie",l:"Chemie",c:"#5e9a38",bg:"#e6f1e0"},
 {k:"fpa",l:"fpA / Projekte",c:"#5f6f91",bg:"#e9ecf3"},
 {k:"foerder",l:"Förderunterricht",c:"#b5573c",bg:"#f7e6e0"},
 {k:"fachuebergreifend",l:"Fachübergreifend",c:"#8a9499",bg:"#eef1f2"}
];
const FACH=k=>FAECHER.find(f=>f.k===k)||FAECHER[FAECHER.length-1];
const MTYP={einfuehrung:{l:"Einführung"},projekt:{l:"Projekt"},lernstand:{l:"Lernstandsgespräch"},gruppenuebung:{l:"Gruppenübung"},selbstlern:{l:"Selbstlernkurs"},checkout:{l:"Check-out"},fachaufsatz:{l:"Fachaufsatztraining"},lernrallye:{l:"Lernrallye"},frage:{l:"Fachliche Frage"},deeperlearning:{l:"Deeper-Learning-Einheit"},feedback:{l:"Block-Feedback"},baustein:{l:"Kurs / Training"},lernen:{l:"Lernbaustein"},vertiefung:{l:"Vertiefung"}};
const FEST_ARTEN=["einfuehrung","projekt","lernstand","gruppenuebung"]; /* meist von der Lehrkraft fest gesetzt */
const MODUL_ARTEN=["einfuehrung","projekt","lernstand","gruppenuebung","selbstlern","checkout","fachaufsatz","lernrallye","deeperlearning","feedback","frage"];
/* Feste Termine der Lehrkräfte (Collection wpEinfuehrungen, Feld art) */
const TART={einfuehrung:{l:"Einführung",i:"",kick:"EINFÜHRUNG",neu:"Neue Einführung",edit:"Einführung bearbeiten",ph:"z. B. Einführung Lernbereich 2",hint:"Fester Termin – die Lehrkraft führt ein, danach steuerst du selbst.",weg:"Diese Einführung löschen?"},lernstand:{l:"Lernstandsgespräch",i:"",kick:"LERNSTANDSGESPRÄCH",neu:"Neues Lernstandsgespräch",edit:"Lernstandsgespräch bearbeiten",ph:"z. B. Lernstandsgespräch Gruppe A",hint:"Fester Termin – deine Lehrkraft spricht mit dir über deinen Lernstand. Bereite dich mit deinem Lernjournal vor.",weg:"Dieses Lernstandsgespräch löschen?"}};
TART.projekt={l:"Projekt",i:"",kick:"PROJEKT",neu:"Neues Projekt",edit:"Projekt bearbeiten",ph:"z. B. Projektstart Lernbereich 2",hint:"Fester Termin – die Lehrkraft setzt das Projekt, danach arbeitet ihr in euren Teams.",weg:"Dieses Projekt löschen?"};
TART.gruppenuebung={l:"Gruppenübung",i:"",kick:"GRUPPENÜBUNG",neu:"Neue Gruppenübung",edit:"Gruppenübung bearbeiten",ph:"z. B. Gruppenübung Fallbeispiel",hint:"Fester Termin – die Lehrkraft legt die Gruppenübung fest. Ihr arbeitet gemeinsam in Gruppen.",weg:"Diese Gruppenübung löschen?"};
const tart=e=>TART[e&&e.art]||TART.einfuehrung;
const artKey=a=>TART[a]?a:"einfuehrung";
const ROUTEN=[["","— keine —"],["fachaufsatz","Fachaufsatz-Training"],["lernwerkzeuge","Lern-Werkzeuge"],["karteikarten","Karteikarten"],["lernstand","Lernstandsmessung"],["kompetenz","Kompetenzwerkstatt"],["projekte","Projekte"],["praktikum","fpA"],["journal","Lernjournal"],["lernpfad","Lernpfad"],["faecher","Fächer & Lernbereiche"],["methoden","Lernmethoden"],["resilienz","Resilienz & Respressi"],["fokus-timer","Fokus-Timer"]];
const TAGE=["Mo","Di","Mi","Do","Fr"],TAGEL=["Montag","Dienstag","Mittwoch","Donnerstag","Freitag"];
const ZEITEN_STD=["08:00","08:45","09:45","10:30","11:30","12:15","13:15","14:00","15:00","15:45"];
const DAUER=45; /* Minuten je Unterrichtsstunde */
/* Flexible Dauer der Lernbausteine: 15–45 Min. im 5-Min.-Takt, dann 60/90/120, Tag(e), Wochen */
const DAUER_OPT=[["15","15 Minuten"],["20","20 Minuten"],["25","25 Minuten"],["30","30 Minuten"],["35","35 Minuten"],["40","40 Minuten"],["45","45 Minuten"],["60","60 Minuten"],["90","90 Minuten"],["120","120 Minuten"],["tag","Ein Tag"],["2tage","Zwei Tage"],["1w","Eine Woche"],["2w","Zwei Wochen"],["3w","Drei Wochen"]];
const LANG_WOCHEN={tag:1,"2tage":1,"3tage":1,"4tage":1,"1w":1,"2w":2,"3w":3};
const LANG_TAGE={tag:1,"2tage":2,"3tage":3,"4tage":4};
/* Eigene Lernzeit (z. B. Prüfungsvorbereitung): zusätzlich 3/4 Std. und mehrere Tage */
const DAUER_EIGEN=[...DAUER_OPT.slice(0,10),["180","3 Stunden"],["240","4 Stunden"],["tag","Ein Tag"],["2tage","Zwei Tage"],["3tage","Drei Tage"],["4tage","Vier Tage"],["1w","Eine Woche"],["2w","Zwei Wochen"],["3w","Drei Wochen"]];
function dauerInfo(x){
 const c=x&&x.dauer?String(x.dauer):"";
 if(!c){const len=(x&&x.len)||1;return {code:"",label:len*DAUER+" Minuten",min:len*DAUER,len,lang:false,wochen:1}}
 const o=DAUER_OPT.find(o=>o[0]===c)||DAUER_EIGEN.find(o=>o[0]===c)||DAUER_OPT[6];
 if(LANG_WOCHEN[c])return {code:c,label:o[1],min:0,len:0,lang:true,wochen:LANG_WOCHEN[c]};
 const min=Number(c)||45;return {code:c,label:o[1],min,len:Math.max(1,Math.ceil(min/DAUER)),lang:false,wochen:1};
}
const eMin=e=>dauerInfo(e).min;
const dauerKurz=i=>i.lang?i.label:i.min+" Min.";
/* Farbsystem: eine feste Farbe je Art – überall gleich (Raster, Leiste, Lehrkraft-Liste, Formulare) */
const ARTEN={
 einfuehrung:{l:"Einführung",c:"#4f86e0",bg:"#e4edfb"},
 lernen:{l:"Lernbaustein",c:"#5aa85a",bg:"#e5f2e2"},
 projekt:{l:"Projekt",c:"#27998b",bg:"#dcf1ee"},
 vertiefung:{l:"Vertiefung",c:"#d9922e",bg:"#fbecd5"},
 baustein:{l:"Kurs / Training",c:"#8a68c9",bg:"#ece6f7"},
 checkout:{l:"Check-out",c:"#d6675c",bg:"#fae3e0"},
 lernstand:{l:"Lernstandsgespräch",c:"#c0568f",bg:"#f6e2ed"},
 gruppenuebung:{l:"Gruppenübung",c:"#5c6bc0",bg:"#e5e8f7"},
 selbstlern:{l:"Selbstlernkurs",c:"#5aa85a",bg:"#e5f2e2"},
 fachaufsatz:{l:"Fachaufsatztraining",c:"#8a68c9",bg:"#ece6f7"},
 lernrallye:{l:"Lernrallye",c:"#d9922e",bg:"#fbecd5"},
 eigen:{l:"Eigene Lernzeit",c:"#6b7f8c",bg:"#eef1f2"},
 frage:{l:"Fachliche Frage",c:"#a8744a",bg:"#f3e6da"},
 deeperlearning:{l:"Deeper-Learning-Einheit",c:"#2a86a8",bg:"#dcf0f6"},
 feedback:{l:"Block-Feedback",c:"#7a8f2e",bg:"#eef2d8"}
};
const ART_REIHE=["einfuehrung","projekt","lernstand","gruppenuebung","selbstlern","checkout","fachaufsatz","lernrallye","deeperlearning","feedback","frage"];
const ART_SCHUELER=["selbstlern","checkout","fachaufsatz","frage"];
const artOf=t=>ARTEN[t]||ARTEN.lernen;
const artStyle=t=>`--ac:${artOf(t).c};--ab:${artOf(t).bg}`;
function artLegende(liste,prefix){return `<div class="wp-legende" aria-label="Farben der Lernbausteine">${prefix?`<b>${esc(prefix)}</b>`:""}${(liste||ART_REIHE).map(k=>`<span class="wp-art" style="${artStyle(k)}">${esc(artOf(k).l)}</span>`).join("")}</div>`}
/* ---------- Gestaltung je Art (eigene Felder) + Lernrallye (wie Actionbound) ---------- */
const ART_FELDER={
 einfuehrung:[{k:"ziel",l:"Ziel der Einführung",t:"text"},{k:"ablauf",l:"Ablauf (ein Schritt pro Zeile)",t:"liste"},{k:"mitbringen",l:"Mitbringen / Vorbereitung",t:"text"}],
 projekt:[{k:"ziel",l:"Projektziel",t:"text"},{k:"produkt",l:"Produkt / Ergebnis",t:"text"},{k:"meilensteine",l:"Meilensteine (einer pro Zeile)",t:"liste"},{k:"team",l:"Teamgröße",t:"kurz"}],
 lernstand:[{k:"vorbereitung",l:"Zur Vorbereitung (Fragen, eine pro Zeile)",t:"liste"},{k:"ablauf",l:"Ablauf des Gesprächs",t:"text"}],
 gruppenuebung:[{k:"auftrag",l:"Auftrag",t:"text"},{k:"gruppe",l:"Gruppengröße",t:"kurz"},{k:"rollen",l:"Rollen (eine pro Zeile)",t:"liste"},{k:"ergebnis",l:"Ergebnissicherung",t:"text"}],
 selbstlern:[{k:"ziele",l:"Lernziele (eins pro Zeile)",t:"liste"},{k:"schritte",l:"Lernschritte (einer pro Zeile)",t:"liste"},{k:"hinweis",l:"Hinweis",t:"text"}],
 checkout:[{k:"fragen",l:"Aufgaben / Fragen (eine pro Zeile)",t:"liste"},{k:"hinweis",l:"Hinweis zur Bearbeitung",t:"text"}],
 fachaufsatz:[{k:"thema",l:"Thema / Prüfungsfrage",t:"text"},{k:"operatoren",l:"Operatoren",t:"kurz"},{k:"hinweis",l:"Hinweis",t:"text"}],
 frage:[{k:"thema",l:"Themen der fachlichen Frage",t:"text"},{k:"vorbereitung",l:"Bitte mitbringen",t:"text"}],
 deeperlearning:[{k:"ziel",l:"Ziel der Einheit",t:"text"},{k:"ablauf",l:"Ablauf (ein Schritt pro Zeile, mit Minuten)",t:"liste"},{k:"material",l:"Material",t:"text"},{k:"checkout",l:"Check-out-Aufgabe",t:"text"},{k:"muster",l:"Musterlösung (nur für Lehrkräfte sichtbar)",t:"text",intern:true}],
 feedback:[{k:"block",l:"Name des Blocks (z. B. Block 2: Psychologie)",t:"kurz"},{k:"hinweis",l:"Hinweis an die Klasse",t:"text"},{k:"extra",l:"Eigene Aussagen zusätzlich (eine pro Zeile, max. 10)",t:"liste",intern:true}]
};
const RALLY_TYPEN=[["info","Info-Seite"],["frei","Frage mit Freitext-Antwort"],["quiz","Quiz (eine richtige Antwort)"],["mehrfach","Quiz (mehrere richtige Antworten)"],["wahrfalsch","Richtig oder falsch"],["luecke","Lückentext"],["zuordnung","Zuordnen (Paare)"],["reihenfolge","Reihenfolge bringen"],["schaetzen","Zahl schätzen / berechnen"],["reflexion","Eigene Antwort (Reflexion)"],["aufgabe","Aufgabe zum Abhaken"]];
const RT_MAX={frei:3,quiz:2,mehrfach:2,wahrfalsch:1,luecke:3,zuordnung:2,reihenfolge:2,schaetzen:3};
const zeilen=t=>String(t||"").split(/\n+/).map(x=>x.trim()).filter(Boolean);
const mischen=a=>{const b=a.slice();for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b};
function rallyEdit(x){
 const o={...x};
 o.optText=(x.optionen||[]).map((t,k)=>((x.typ==="mehrfach"?(x.richtige||[]).includes(k):k===x.richtig)?"*":"")+t).join("\n");
 o.paareText=(x.paare||[]).map(p=>p[0]+" = "+p[1]).join("\n");
 o.reihenText=(x.reihe||[]).join("\n");
 return o;
}
function gestFelderHtml(typ,g){
 g=g||{};
 if(typ==="lernrallye")return rallyEditorHtml();
 const f=ART_FELDER[typ]||[];
 const vl=typ==="deeperlearning"?`<div class="wp-vorlage"><button type="button" class="secondary" onclick="wp.dlVorlage()">Vorlage „Fachaufsatz“ einfügen</button><small>Füllt Titel, Ablauf, Check-out und Musterlösung vor. Danach nur noch prüfen.</small></div>`:typ==="feedback"?`<p class="wp-hint">Die 15 Standardaussagen (Lernen, Selbststeuerung, Zusammenarbeit, Material, Gesamteindruck) sind immer dabei. Eigene Aussagen unten ergänzen.</p>`:"";
 return vl+f.map(x=>{const v=Array.isArray(g[x.k])?g[x.k].join("\n"):(g[x.k]||"");
  return `<label>${esc(x.l)}${x.t==="kurz"?`<input id="gf_${x.k}" maxlength="80" value="${esc(v)}">`:`<textarea id="gf_${x.k}" rows="${x.t==="liste"?4:3}" maxlength="1200">${esc(v)}</textarea>`}</label>`}).join("");
}
function gestLesen(typ){
 const g={};if(typ==="lernrallye")return g;
 (ART_FELDER[typ]||[]).forEach(x=>{const v=($("gf_"+x.k)?.value||"").trim();if(!v)return;g[x.k]=x.t==="liste"?v.split(/\n+/).map(t=>t.trim()).filter(Boolean):v});
 return g;
}
function rallyEditorHtml(){
 const r=S.rally||[];
 return `<div class="wp-rally-ed"><b>Stationen der Lernrallye</b><small>Die Schüler:innen gehen Station für Station durch, lösen Aufgaben und sammeln Punkte – wie bei einer Rallye.</small>
 ${r.map((st,i)=>`<div class="wp-station"><div class="wp-st-h"><b>Station ${i+1}</b><span><button type="button" class="text-button" onclick="wp.rallyMove(${i},-1)">nach oben</button><button type="button" class="text-button" onclick="wp.rallyMove(${i},1)">nach unten</button><button type="button" class="text-button" onclick="wp.rallyDel(${i})">entfernen</button></span></div>
  <label>Art<select onchange="wp.rallySet(${i},'typ',this.value,true)">${RALLY_TYPEN.map(t=>`<option value="${t[0]}" ${t[0]===st.typ?"selected":""}>${t[1]}</option>`).join("")}</select></label>
  <label>Titel<input maxlength="80" value="${esc(st.titel||"")}" oninput="wp.rallySet(${i},'titel',this.value)"></label>
  <label>Text / Aufgabe<textarea rows="2" maxlength="600" oninput="wp.rallySet(${i},'text',this.value)">${esc(st.text||"")}</textarea></label>
  ${st.typ==="frei"?`<label>Richtige Antwort(en), mehrere mit | trennen<input maxlength="200" value="${esc(st.antwort||"")}" oninput="wp.rallySet(${i},'antwort',this.value)"></label>`:""}
  ${st.typ==="quiz"||st.typ==="mehrfach"?`<label>Antwortmöglichkeiten (eine pro Zeile, ${st.typ==="quiz"?"die richtige":"jede richtige"} mit * am Anfang)<textarea rows="4" maxlength="500" oninput="wp.rallySet(${i},'optText',this.value)">${esc(st.optText||"")}</textarea></label>`:""}
  ${st.typ==="wahrfalsch"?`<label>Die Aussage ist<select onchange="wp.rallySet(${i},'wf',this.value)"><option value="w" ${st.wf!=="f"?"selected":""}>richtig</option><option value="f" ${st.wf==="f"?"selected":""}>falsch</option></select></label>`:""}
  ${st.typ==="luecke"?`<label>Lückentext – Lücken in [eckigen Klammern], Alternativen mit | trennen<textarea rows="3" maxlength="600" oninput="wp.rallySet(${i},'lueckText',this.value)">${esc(st.lueckText||"")}</textarea></label>`:""}
  ${st.typ==="zuordnung"?`<label>Paare (eins pro Zeile: Begriff = Zuordnung)<textarea rows="4" maxlength="600" oninput="wp.rallySet(${i},'paareText',this.value)">${esc(st.paareText||"")}</textarea></label>`:""}
  ${st.typ==="reihenfolge"?`<label>Elemente in der richtigen Reihenfolge (eins pro Zeile; die Schüler sehen sie gemischt)<textarea rows="4" maxlength="600" oninput="wp.rallySet(${i},'reihenText',this.value)">${esc(st.reihenText||"")}</textarea></label>`:""}
  ${st.typ==="schaetzen"?`<div class="wp-st-zwei"><label>Richtige Zahl<input inputmode="decimal" value="${esc(st.zahl??"")}" oninput="wp.rallySet(${i},'zahl',this.value)"></label><label>Toleranz (±)<input inputmode="decimal" value="${esc(st.tol??0)}" oninput="wp.rallySet(${i},'tol',this.value)"></label></div>`:""}
  ${st.typ!=="info"?`<div class="wp-st-zwei"><label>Punkte<input type="number" min="0" max="20" value="${esc(st.punkte??10)}" oninput="wp.rallySet(${i},'punkte',this.value)"></label><label>Hinweis (optional)<input maxlength="200" value="${esc(st.hinweis||"")}" oninput="wp.rallySet(${i},'hinweis',this.value)"></label></div>`:""}
 </div>`).join("")}
 <button type="button" class="secondary" onclick="wp.rallyAdd()">＋ Station hinzufügen</button></div>`;
}
function rallyClean(st){
 const o={typ:st.typ||"info",titel:String(st.titel||"").slice(0,80),text:String(st.text||"").slice(0,600),punkte:Math.max(0,Math.min(20,Number(st.punkte)||0)),hinweis:String(st.hinweis||"").slice(0,200)};
 if(o.typ==="frei")o.antwort=String(st.antwort||"").slice(0,200);
 if(o.typ==="quiz"){const l=String(st.optText||"").split(/\n+/).map(t=>t.trim()).filter(Boolean);o.richtig=Math.max(0,l.findIndex(t=>t.startsWith("*")));o.optionen=l.map(t=>t.replace(/^\*\s*/,""))}
 if(o.typ==="mehrfach"){const l=zeilen(st.optText).slice(0,8);o.richtige=l.map((t,k)=>t.startsWith("*")?k:-1).filter(k=>k>=0);o.optionen=l.map(t=>t.replace(/^\*\s*/,""))}
 if(o.typ==="wahrfalsch")o.wf=st.wf==="f"?"f":"w";
 if(o.typ==="luecke")o.lueckText=String(st.lueckText||"").slice(0,600);
 if(o.typ==="zuordnung")o.paare=zeilen(st.paareText).slice(0,8).map(t=>t.split("=").map(a=>a.trim())).filter(p=>p[0]&&p[1]).map(p=>[p[0].slice(0,80),p.slice(1).join("=").slice(0,80)]);
 if(o.typ==="reihenfolge")o.reihe=zeilen(st.reihenText).slice(0,8).map(t=>t.slice(0,100));
 if(o.typ==="schaetzen"){o.zahl=Number(String(st.zahl).replace(",","."))||0;o.tol=Math.abs(Number(String(st.tol||0).replace(",","."))||0)}
 if(o.typ==="info")o.punkte=0;
 return o;
}
const rallyRerender=()=>{const b=$("mfGest");if(b)b.innerHTML=gestFelderHtml("lernrallye",{})};
function rallyAdd(){S.rally=S.rally||[];S.rally.push({typ:"frei",titel:"",text:"",antwort:"",punkte:10});rallyRerender()}
function rallyDel(i){S.rally.splice(i,1);rallyRerender()}
function rallyMove(i,d){const j=i+d;if(j<0||j>=S.rally.length)return;[S.rally[i],S.rally[j]]=[S.rally[j],S.rally[i]];rallyRerender()}
function rallySet(i,k,v,re){S.rally[i][k]=v;if(re)rallyRerender()}
function gestaltungHtml(m){
 if(!m)return "";
 const g=m.gestaltung||{};
 let h=(ART_FELDER[m.typ]||[]).map(x=>{const v=g[x.k];if(x.intern||!v||(Array.isArray(v)&&!v.length))return "";
  return `<div class="wp-gest-b"><b>${esc(x.l.replace(/\s*\(.*\)$/,""))}</b>${Array.isArray(v)?`<ol>${v.map(t=>`<li>${esc(t)}</li>`).join("")}</ol>`:`<p>${esc(v)}</p>`}</div>`}).join("");
 if(m.typ==="lernrallye"&&(m.rallye||[]).length){const R=m.rallye,mx=R.reduce((a,x)=>a+(x.punkte||0),0);h=`<div class="wp-gest-b"><b>Lernrallye</b><p>${R.length} Stationen · bis zu ${mx} Punkte</p></div>`}
 return h?`<div class="wp-gest-view" style="${artStyle(m.typ)}">${h}</div>`:"";
}
function rallyKnopf(e,m){
 if(!m||m.typ!=="lernrallye"||!(m.rallye||[]).length)return "";
 const fertig=e&&e.rallye,lauf=e&&e.rallyStand&&e.rallyStand.i>0;
 return `${fertig?`<p class="wp-hint">Ergebnis: ${e.rallye.punkte} von ${e.rallye.max} Punkten.</p>`:""}<div class="form-actions"><button class="primary" onclick="wp.rpStart('${e?e.id:""}','${m.id}')">${fertig?"Rallye wiederholen":lauf?"Rallye fortsetzen":"Rallye starten"}</button></div>`;
}
/* Rallye-Spieler: Station für Station, Punkte, Hinweis */
function rpStart(eid,mid){
 const m=S.d.module.find(x=>x.id===mid);if(!m)return;
 const e=eid?S.d.plan.eintraege.find(x=>x.id===eid):null;
 const neu_=!e||e.rallye||!e.rallyStand;
 S.rp={m,e,vorschau:!e,st:neu_?{i:0,pts:0,fehl:0,hint:false}:{...e.rallyStand}};
 rpZeige();
}
function rpZeige(){
 const {m,st}=S.rp,R=m.rallye||[];
 if(st.i>=R.length)return rpEnde();
 const x=R[st.i],mx=R.reduce((a,y)=>a+(y.punkte||0),0);
 let body="";
 if(x.typ==="info")body=`<div class="form-actions"><button class="primary" onclick="wp.rpWeiter(0)">Weiter</button></div>`;
 else if(x.typ==="aufgabe")body=`<div class="form-actions"><button class="primary" onclick="wp.rpWeiter(${x.punkte||0})">Erledigt (+${x.punkte||0})</button></div>`;
 else if(x.typ==="frei")body=`<label class="form"><span>Deine Antwort</span><input id="rpA" maxlength="120" onkeydown="if(event.key==='Enter')wp.rpPruefen()"></label><div id="rpFb" class="wp-rp-fb"></div><div class="form-actions"><button class="secondary" onclick="wp.rpHinweis()">Hinweis</button><button class="primary" onclick="wp.rpPruefen()">Prüfen</button></div>`;
 else if(x.typ==="quiz")body=`<div class="wp-rp-opt">${(x.optionen||[]).map((o,k)=>`<button type="button" class="secondary" onclick="wp.rpWahl(${k})">${esc(o)}</button>`).join("")}</div><div id="rpFb" class="wp-rp-fb"></div><div class="form-actions"><button class="secondary" onclick="wp.rpHinweis()">Hinweis</button></div>`;
 else{
  const hk=`<div id="rpFb" class="wp-rp-fb"></div><div class="form-actions"><button class="secondary" onclick="wp.rpHinweis()">Hinweis</button><button class="primary" onclick="wp.rpPruefen()">Prüfen</button></div>`;
  if(x.typ==="mehrfach")body=`<div class="wp-rp-opt">${(x.optionen||[]).map((o,k)=>`<label class="wp-rp-chk"><input type="checkbox" class="rpC" value="${k}"> ${esc(o)}</label>`).join("")}</div>${hk}`;
  else if(x.typ==="wahrfalsch")body=`<div class="wp-rp-opt"><button type="button" class="secondary" onclick="wp.rpWahl('w')">Richtig</button><button type="button" class="secondary" onclick="wp.rpWahl('f')">Falsch</button></div><div id="rpFb" class="wp-rp-fb"></div>`;
  else if(x.typ==="luecke"){let n=0;const t=String(x.lueckText||"").split(/(\[[^\]]+\])/).map(q=>/^\[[^\]]+\]$/.test(q)?`<input class="rpL" data-k="${n++}" maxlength="60" size="10">`:esc(q)).join("");body=`<p class="wp-rp-luecke">${t}</p>${hk}`}
  else if(x.typ==="zuordnung"){const re=mischen((x.paare||[]).map(p=>p[1]));body=`<div class="wp-rp-opt">${(x.paare||[]).map((p,k)=>`<label class="wp-rp-zu"><span>${esc(p[0])}</span><select class="rpZ" data-k="${k}"><option value="">– wählen –</option>${re.map(r=>`<option>${esc(r)}</option>`).join("")}</select></label>`).join("")}</div>${hk}`}
  else if(x.typ==="reihenfolge"){let mx_=mischen(x.reihe||[]);for(let q=0;q<9&&(x.reihe||[]).length>1&&mx_.join("\u0001")===(x.reihe||[]).join("\u0001");q++)mx_=mischen(x.reihe);S.rp.mix=mx_;S.rp.gew=[];body=`<div id="rpRh"></div><div class="wp-rp-opt" id="rpRo"></div>${hk}`}
  else if(x.typ==="schaetzen")body=`<label class="form"><span>Deine Zahl</span><input id="rpA" inputmode="decimal" maxlength="20" onkeydown="if(event.key==='Enter')wp.rpPruefen()"></label>${hk}`;
  else if(x.typ==="reflexion")body=`<label class="form"><span>Deine Antwort</span><textarea id="rpA" rows="4" maxlength="600"></textarea></label><div id="rpFb" class="wp-rp-fb"></div><div class="form-actions"><button class="primary" onclick="wp.rpPruefen()">Abschicken (+${x.punkte||0})</button></div>`;
 }
 modalOpen(`<div class="wp-artband" style="${artStyle("lernrallye")}">Lernrallye${S.rp.vorschau?" · Vorschau":""}</div><div class="wp-rp-kopf"><span>Station ${st.i+1} von ${R.length}</span><span>${st.pts} / ${mx} Punkte</span></div><div class="wp-rp-bar"><i style="width:${Math.round(st.i/R.length*100)}%"></i></div><h2>${esc(x.titel||"Station "+(st.i+1))}</h2><p>${esc(x.text||"")}</p>${body}`);
 if(x.typ==="reihenfolge")rpRh();
}
function rpRh(){
 const ro=$("rpRo"),rh=$("rpRh");if(!ro||!rh)return;const {mix,gew}=S.rp;
 rh.innerHTML=gew.length?`<ol class="wp-rp-rh">${gew.map(i=>`<li>${esc(mix[i])}</li>`).join("")}</ol><button type="button" class="text-button" onclick="wp.rpRhReset()">Zurücksetzen</button>`:`<p class="wp-hint">Tippe die Elemente in der richtigen Reihenfolge an.</p>`;
 ro.innerHTML=mix.map((t,i)=>gew.includes(i)?"":`<button type="button" class="secondary" onclick="wp.rpRhAdd(${i})">${esc(t)}</button>`).join("");
}
function rpRhAdd(i){S.rp.gew.push(i);rpRh()}
function rpRhReset(){S.rp.gew=[];rpRh()}
function rpLoesung(x){
 if(x.typ==="quiz")return x.optionen[x.richtig];
 if(x.typ==="mehrfach")return (x.richtige||[]).map(k=>x.optionen[k]).join("; ");
 if(x.typ==="wahrfalsch")return x.wf==="f"?"falsch":"richtig";
 if(x.typ==="luecke")return (String(x.lueckText||"").match(/\[[^\]]+\]/g)||[]).map(q=>q.slice(1,-1).split("|")[0]).join(", ");
 if(x.typ==="zuordnung")return (x.paare||[]).map(p=>p[0]+" = "+p[1]).join("; ");
 if(x.typ==="reihenfolge")return (x.reihe||[]).join(" → ");
 if(x.typ==="schaetzen")return String(x.zahl).replace(".",",")+(x.tol?" (± "+String(x.tol).replace(".",",")+")":"");
 return String(x.antwort||"").split("|")[0];
}
function rpFb(t,ok){const f=$("rpFb");if(f){f.className="wp-rp-fb "+(ok?"ok":"nein");f.textContent=t}}
function rpHinweis(){const x=S.rp.m.rallye[S.rp.st.i];S.rp.st.hint=true;rpFb(x.hinweis?"Hinweis: "+x.hinweis:"Für diese Station gibt es keinen Hinweis.",true)}
async function rpGewinn(x,richtig){
 const st=S.rp.st,p=x.punkte||0;
 const g=richtig?((st.fehl===0&&!st.hint)?p:Math.ceil(p/2)):0;
 st.pts+=g;
 const f=$("rpFb");
 if(f){f.className="wp-rp-fb "+(richtig?"ok":"nein");f.innerHTML=(richtig?"Richtig! +"+g+" Punkte":"Die richtige Lösung war: "+esc(rpLoesung(x)))+`<div class="form-actions"><button class="primary" onclick="wp.rpWeiter(0)">Weiter</button></div>`}
}
async function rpWeiter(punkte){
 const st=S.rp.st;st.pts+=punkte;st.i++;st.fehl=0;st.hint=false;
 if(S.rp.e){S.rp.e.rallyStand={...st};try{await speichern()}catch(e){}}
 rpZeige();
}
function rpPruefen(){
 const x=S.rp.m.rallye[S.rp.st.i],t=x.typ,A=($("rpA")?.value||"").trim();let ok;
 if(t==="reflexion"){if(A.length<5)return rpFb("Bitte schreibe mindestens einen Satz.",false);const st=S.rp.st;st.antw=st.antw||{};st.antw[st.i]=A.slice(0,600);return rpWeiter(x.punkte||0)}
 if(t==="frei"){if(!A)return;ok=String(x.antwort||"").split("|").map(q=>q.trim().toLowerCase()).filter(Boolean).includes(A.toLowerCase())}
 else if(t==="schaetzen"){if(!A)return;const z=Number(A.replace(",","."));if(isNaN(z))return rpFb("Bitte gib eine Zahl ein.",false);ok=Math.abs(z-x.zahl)<=(x.tol||0)+1e-9}
 else if(t==="mehrfach"){const g=[...document.querySelectorAll(".rpC:checked")].map(c=>Number(c.value)).sort().join();if(!g)return rpFb("Wähle mindestens eine Antwort.",false);ok=g===(x.richtige||[]).slice().sort().join()}
 else if(t==="luecke"){const alt=(String(x.lueckText||"").match(/\[[^\]]+\]/g)||[]).map(q=>q.slice(1,-1).split("|").map(w=>w.trim().toLowerCase()));const ein=[...document.querySelectorAll(".rpL")].map(i=>i.value.trim().toLowerCase());if(ein.some(v=>!v))return rpFb("Fülle alle Lücken aus.",false);ok=alt.every((a,k)=>a.includes(ein[k]))}
 else if(t==="zuordnung"){const w=[...document.querySelectorAll(".rpZ")].map(s=>s.value);if(w.some(v=>!v))return rpFb("Ordne alle Begriffe zu.",false);ok=(x.paare||[]).every((p,k)=>p[1]===w[k])}
 else if(t==="reihenfolge"){const {mix,gew}=S.rp;if(gew.length<mix.length)return rpFb("Bringe zuerst alle Elemente in eine Reihenfolge.",false);ok=gew.every((i,k)=>mix[i]===x.reihe[k])}
 else return;
 if(ok)return rpGewinn(x,true);
 S.rp.st.fehl++;
 const mxv=RT_MAX[t]||2;
 if(S.rp.st.fehl>=mxv)return rpGewinn(x,false);
 rpFb("Leider nicht richtig – versuche es noch einmal ("+S.rp.st.fehl+"/"+mxv+").",false);
}
function rpWahl(k){
 const x=S.rp.m.rallye[S.rp.st.i];
 if(k===x.richtig||k===x.wf)return rpGewinn(x,true);
 S.rp.st.fehl++;
 if(S.rp.st.fehl>=(RT_MAX[x.typ]||2))return rpGewinn(x,false);
 rpFb("Leider falsch – wähle noch einmal.",false);
}
async function rpEnde(){
 const {m,st,e}=S.rp,R=m.rallye||[],mx=R.reduce((a,y)=>a+(y.punkte||0),0),pr=mx?st.pts/mx:1;
 const badge=pr>=.8?"Gold":pr>=.5?"Silber":"Bronze";
 if(e){e.rallye={punkte:st.pts,max:mx};delete e.rallyStand;e.erledigt=true;e.doneAt=Date.now();try{await speichern()}catch(x){}}
 modalOpen(`<div class="wp-artband" style="${artStyle("lernrallye")}">Lernrallye geschafft</div><h2>${esc(m.titel)}</h2><p class="wp-rp-gross">${st.pts} von ${mx} Punkten</p><p>Abzeichen: <b>${badge}</b>${S.rp.vorschau?" (Vorschau – nichts wird gespeichert)":""}</p><div class="form-actions"><button class="primary" onclick="closeModal()">Schließen</button></div>`);
 if(e)neu();
}
function vorschau(mid){
 const m=S.d.module.find(x=>x.id===mid);if(!m)return;
 modalOpen(`<div class="wp-artband" style="${artStyle(m.typ)}">${esc(artOf(m.typ).l)} · Vorschau für Schüler:innen</div><div class="kicker">${esc(FACH(m.fach).l)} · ${esc(dauerKurz(dauerInfo(m)))}</div><h2>${esc(m.titel)}</h2>${m.beschr?`<p>${esc(m.beschr)}</p>`:""}${gestaltungHtml(m)}${anhHtml(m.anhaenge)}${rallyKnopf(null,m)}<div class="form-actions"><button class="secondary" onclick="closeModal()">Schließen</button></div>`);
}
/* Anhänge (Storage: wpAnhaenge/…): PDF, Word, Bild, Video, Audio */
const ANH_ERLAUBT=/\.(pdf|docx?|png|jpe?g|gif|webp|heic|mp4|mov|webm|m4v|mp3|m4a|wav|ogg|aac)$/i;
function anhArt(a){const n=String(a.name||"").toLowerCase();if(/\.(png|jpe?g|gif|webp|heic)$/.test(n))return "bild";if(/\.(mp4|mov|webm|m4v)$/.test(n))return "video";if(/\.(mp3|m4a|wav|ogg|aac)$/.test(n))return "audio";return "datei"}
function anhHtml(list){
 list=(Array.isArray(list)?list:[]).filter(a=>a&&/^https:\/\//.test(a.url||""));
 if(!list.length)return "";
 return `<div class="wp-anh"><b>Anhänge</b>${list.map(a=>{const t=anhArt(a),u=esc(a.url),n=esc(a.name||"Datei");
  if(t==="bild")return `<a href="${u}" target="_blank" rel="noopener"><img src="${u}" alt="${n}" loading="lazy"></a>`;
  if(t==="video")return `<video controls preload="metadata" src="${u}"></video><small>${n}</small>`;
  if(t==="audio")return `<div><audio controls preload="none" src="${u}"></audio><small>${n}</small></div>`;
  return `<a class="wp-datei" href="${u}" target="_blank" rel="noopener">${n}</a>`}).join("")}</div>`;
}
function anhListe(){return (S.anh||[]).map((a,i)=>`<div class="wp-anhz"><span>${esc(a.name||"Datei")}</span><button type="button" class="secondary" onclick="wp.anhWeg(${i})">Entfernen</button></div>`).join("")||'<small class="wp-leer">Noch kein Anhang.</small>'}
function anhForm(){return `<div class="wp-anhform"><b>Anhänge</b><small>PDF, Word, Bild, Video oder Audio · max. 15 MB je Datei</small><div id="anhListe">${anhListe()}</div><input id="anhDatei" type="file" multiple accept=".pdf,.doc,.docx,image/*,video/*,audio/*" onchange="wp.anhHoch(this)"><small id="anhStatus"></small></div>`}
async function anhHoch(inp){
 const files=[...(inp.files||[])],st=$("anhStatus");
 for(const f of files){
  if(!ANH_ERLAUBT.test(f.name)&&!/^(image|video|audio)\//.test(f.type||"")){fb.toast("„"+f.name+"“: Dateityp nicht erlaubt.");continue}
  if(st)st.textContent="Lädt hoch: "+f.name+" …";
  try{const r=await fb.upload(f,"wpAnhaenge/lernbausteine");S.anh.push({url:r.url,name:f.name,path:r.path})}
  catch(e){console.error(e);fb.toast(e?.message||"Upload nicht möglich.")}
 }
 inp.value="";if(st)st.textContent="";const l=$("anhListe");if(l)l.innerHTML=anhListe();
}
function anhWeg(i){S.anh.splice(i,1);const l=$("anhListe");if(l)l.innerHTML=anhListe()}
function artVorschau(t){const b=$("mfBand");if(!b)return;const fw=$("mfFuerWrap");if(fw){fw.hidden=t!=="lernstand";if(t==="lernstand"&&!$("fuerListe")){fw.innerHTML=fuerHtml([]);fuerLaden()}}b.setAttribute("style",artStyle(t));b.textContent=artOf(t).l;const w=$("mfWrap");if(w)w.setAttribute("style",artStyle(t));const g=$("mfGest");if(g){if(t==="lernrallye"&&!(S.rally||[]).length)S.rally=[{typ:"info",titel:"Willkommen",text:"",punkte:0},{typ:"frei",titel:"",text:"",antwort:"",punkte:10}];g.innerHTML=gestFelderHtml(t,{})}const ft=$("mfFixTag");if(ft&&FEST_ARTEN.includes(t)&&ft.value==="")ft.value="0"}
const AUSZEIT_ARTEN=[["bewegung","Bewegung an der frischen Luft"],["ruhe","Ruhe / Atemübung"],["pause","Pause & etwas essen"],["gespraech","kurz abschalten mit Mitschüler:innen"]];

/* ---------- Datum ---------- */
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const parse=s=>{const [y,m,d]=String(s).split("-").map(Number);return new Date(y,m-1,d)};
const monday=d=>{const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()-((x.getDay()+6)%7));return x};
const addD=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
function kwNr(d){const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));const n=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-n);const y0=new Date(Date.UTC(t.getUTCFullYear(),0,1));return Math.ceil(((t-y0)/864e5+1)/7)}
const dm=d=>String(d.getDate()).padStart(2,"0")+"."+String(d.getMonth()+1).padStart(2,"0")+".";
function wochenText(w){const a=parse(w),b=addD(a,4);return "KW "+kwNr(a)+" · "+dm(a)+"–"+dm(b)+a.getFullYear()}
const heute=()=>iso(monday(new Date()));

/* ---------- Zustand ---------- */
const S=window.__wpS=window.__wpS||{woche:heute(),ansicht:"verplant",tab:"uebersicht",tag:Math.min(4,(new Date().getDay()+6)%7),armed:null,zeiten:null,d:{},chatUnsub:null,filter:"alle"};
window.__wpStop=()=>{if(S.chatUnsub){try{S.chatUnsub()}catch(e){}S.chatUnsub=null}};
const zeiten=()=>S.zeiten||ZEITEN_STD;
function zeitBereich(h,len){const s=zeiten()[h-1]||"";const [hh,mm]=(zeiten()[h+len-2]||"").split(":").map(Number);if(isNaN(hh))return s;const e=hh*60+mm+DAUER;return s+"–"+String(Math.floor(e/60)).padStart(2,"0")+":"+String(e%60).padStart(2,"0")}

/* ---------- Laden ---------- */
async function ladeAllgemein(){
 const w=S.woche,t=isT(),live=t?[]:[W("status","live")];
 const z=await gdoc("wpEinstellungen","zeiten");if(z&&Array.isArray(z.liste)&&z.liste.length===10)S.zeiten=z.liste;
 const [m1,m2,einf,slots,wo]=await Promise.all([
  qdocs("wpModule",...live,W("woche",w)).catch(()=>[]),qdocs("wpModule",...live,W("woche","")).catch(()=>[]),
  qdocs("wpEinfuehrungen",...live,W("woche",w)).catch(()=>[]),qdocs("wpSlots",...live,W("woche",w)).catch(()=>[]),
  gdoc("wpWochen",w)]);
 const me0=fb.currentUser&&fb.currentUser.uid,mein=x=>t||!Array.isArray(x.fuer)||!x.fuer.length||x.fuer.includes(me0);
 S.d.module=[...m1,...m2].filter(mein).sort((a,b)=>String(a.fach).localeCompare(String(b.fach))||String(a.titel).localeCompare(String(b.titel),"de"));
 S.d.einf=einf.filter(mein);S.d.slots=slots;S.d.wochenDoc=wo;
}
async function ladeSchueler(){
 await ladeAllgemein();const w=S.woche,me=uid();
 const [plan,belegt,mein,anfV,anfT,tutoren,v1,v2]=await Promise.all([
  gdoc("wpPlan",me+"_"+w),qdocs("wpBelegt").catch(()=>[]),qdocs("wpBuchungen",W("uid",me)).catch(()=>[]),
  qdocs("wpAnfragen",W("vonUid",me)).catch(()=>[]),qdocs("wpAnfragen",W("tutorUid",me)).catch(()=>[]),qdocs("wpTutor").catch(()=>[]),
  gdoc("wpPlan",me+"_"+iso(addD(parse(w),-7))),gdoc("wpPlan",me+"_"+iso(addD(parse(w),-14)))]);
 const [fbg,lp,ip,gp,zl]=await Promise.all([qdocs("wpFbGegeben",W("uid",me)).catch(()=>[]),gdoc("wpLernplan",me),gdoc("wpImpuls",me+"_"+w),gdoc("wpGespraeche",me+"_"+w),gdoc("wpZiele",me)]);
 S.d.fbGegeben=new Set(fbg.map(x=>x.moduleId));S.d.lernplan=lp&&Array.isArray(lp.termine)?lp:{termine:[]};S.d.impulsPers=ip;S.d.gesp=gp?[gp]:[];S.d.zielGespraech=zl;
 S.d.laufend=[[v1,1],[v2,2]].flatMap(([pp,k])=>pp?(pp.eintraege||[]).filter(e=>e.lang&&!e.erledigt&&dauerInfo(e).wochen>k).map(e=>({...e,woche:pp.woche})):[]);
 S.d.plan=plan||{id:me+"_"+w,uid:me,woche:w,eintraege:[],ziel:"",rueckblick:"",geteilt:false};
 if(!Array.isArray(S.d.plan.eintraege))S.d.plan.eintraege=[];
 S.d.offen=offenBerechnen(v1);
 S.d.belegt=new Set(belegt.map(b=>b.id));S.d.buch=mein.filter(b=>b.woche===w);
 S.d.anfV=anfV;S.d.anfT=anfT;S.d.tutoren=tutoren;
}
/* ---------- Belegung ---------- */
function bloecke(){
 const b=[],w=S.woche;
 S.d.einf.forEach(e=>b.push({k:"einf",d:e.d,h:e.h,len:e.len||1,titel:e.titel,fach:e.fach,sub:tart(e).l+(e.lehrkraft?" · "+e.lehrkraft:"")+(e.raum?" · "+e.raum:""),id:e.id,art:e.art||"einfuehrung",entwurf:e.status!=="live"}));
 if(!isT()){
  S.d.buch.forEach(x=>b.push({k:"termin",d:x.d,h:x.h,len:x.len||1,titel:"Termin: "+(x.lehrkraft||"Lehrkraft"),fach:x.fach||"fachuebergreifend",sub:x.frage||"",id:x.id}));
  const me=uid();
  [...S.d.anfV,...S.d.anfT].filter((x,i,a)=>x.woche===w&&a.findIndex(y=>y.id===x.id)===i&&["offen","angenommen"].includes(x.status)).forEach(x=>{
   const ichTutor=x.tutorUid===me;if(ichTutor&&x.status==="offen")return;
   b.push({k:"tutor",d:x.d,h:x.h,len:x.len||1,titel:(x.art==="kompetenz"?"Kompetenz: ":"Tutoring: ")+(ichTutor?x.vonPseudo:x.tutorPseudo),fach:x.fach||"fachuebergreifend",sub:(x.status==="offen"?"angefragt · ":"")+(x.thema||""),id:x.id,offen:x.status==="offen"});
  });
  (S.d.gesp||[]).forEach(g=>b.push({k:"gesp",d:g.d,h:g.h,len:g.len||1,titel:"Lernstandsgespräch",fach:"fachuebergreifend",sub:(g.lehrkraft||"")+(g.raum?" · "+g.raum:""),id:g.id}));
  S.d.plan.eintraege.filter(e=>!e.lang).forEach(e=>b.push({k:"plan",...e}));
 }else{
  S.d.slots.forEach(s=>b.push({k:"slot",d:s.d,h:s.h,len:s.len||1,titel:"Sprechzeit",fach:s.fach,sub:(s.lehrkraft||"")+(s.status!=="live"?" · Entwurf":""),id:s.id,entwurf:s.status!=="live"}));
 }
 return b;
}
function frei(d,h,len,exceptId){
 if(h<1||h+len-1>10||d<0||d>4)return false;
 return !bloecke().some(x=>x.id!==exceptId&&x.d===d&&!(h+len-1<x.h||h>x.h+(x.len||1)-1));
}
/* ---------- Kennzahlen ---------- */
function kennzahlen(){
 const mods=S.d.module.filter(m=>m.woche===S.woche);
 const pl=S.d.plan.eintraege,ids=new Set(pl.filter(e=>e.moduleId).map(e=>e.moduleId));
 const modGeplant=mods.filter(m=>ids.has(m.id)).length;
 const modErledigt=mods.filter(m=>pl.some(e=>e.moduleId===m.id&&e.erledigt)).length;
 const lern=pl.filter(e=>["modul","eigen"].includes(e.typ));
 return {modGesamt:mods.length,modGeplant,modErledigt,
  geplantMin:lern.reduce((s,e)=>s+eMin(e),0),erledigtMin:lern.filter(e=>e.erledigt).reduce((s,e)=>s+eMin(e),0),
  checkouts:pl.filter(e=>e.mTyp==="checkout"&&e.erledigt).length,termine:S.d.buch.length,
  auszeiten:pl.filter(e=>e.typ==="auszeit").length,tutoring:bloecke().filter(x=>x.k==="tutor"&&!x.offen).length};
}
const std=min=>{const h=min/60;return (Math.round(h*10)/10).toString().replace(".",",")+" Std."};
async function speichern(){
 const p=S.d.plan,me=uid(),k=kennzahlen();
 const docu={uid:me,woche:S.woche,eintraege:p.eintraege,ziel:p.ziel||"",rueckblick:p.rueckblick||"",geteilt:!!p.geteilt,verworfen:(p.verworfen||[]).slice(-40),updatedAt:fb.serverTimestamp()};
 try{
  await fb.setDoc(ref("wpPlan",me+"_"+S.woche),docu);
  await fb.setDoc(ref("wpStatus",me+"_"+S.woche),{uid:me,pseudo:pseudo(),woche:S.woche,modGesamt:k.modGesamt,modGeplant:k.modGeplant,modErledigt:k.modErledigt,geplantMin:k.geplantMin,erledigtMin:k.erledigtMin,checkouts:k.checkouts,termine:k.termine,geteilt:!!p.geteilt,updatedAt:fb.serverTimestamp()});
 }catch(e){console.error(e);fb.toast("Speichern nicht möglich.");throw e}
}

/* ---------- Raster ---------- */
function blockHtml(b){return blockHtml0(b).replace(/^<div /,`<div data-d="${b.d}" `)}
function blockHtml0(b){
 const f=FACH(b.fach),st=`grid-column:${b.d+2};grid-row:${b.h+1}/span ${b.len||1}`;
 if(b.k==="einf"){
  const attr=isT()?`onclick="wp.einfBearbeiten('${b.id}')"`:`onclick="wp.info('einf','${b.id}')"`;
  return `<div class="wp-b einf art ${b.art==="lernstand"?"lernstand":""}${b.entwurf?" entwurf":""}" style="${st};--fc:${f.c};--fb:${f.bg};${artStyle(artKey(b.art))}" ${attr}><span class="wp-lock" title="Fester Termin der Lehrkraft">${tart(b).i}</span><b>${esc(b.titel)}</b><small>${esc(b.sub)}${b.entwurf?" · Entwurf":""}</small></div>`}
 if(b.k==="gesp"){return `<div class="wp-b einf art lernstand" style="${st};--fc:${f.c};--fb:${f.bg};${artStyle("lernstand")}" onclick="wp.info('gesp','${b.id}')"><span class="wp-lock" title="Fester Termin der Lehrkraft"></span><b>${esc(b.titel)}</b><small>${esc(b.sub)}</small></div>`}
 if(b.k==="slot"){return `<div class="wp-b termin${b.entwurf?" entwurf":""}" style="${st}" onclick="wp.slotBearbeiten('${b.id}')"><span class="wp-ic"></span><b>${esc(b.titel)}</b><small>${esc(b.sub)}</small></div>`}
 if(b.k==="termin"){return `<div class="wp-b termin art" style="${st};--fc:${f.c};${artStyle("frage")}" onclick="wp.info('termin','${b.id}')"><span class="wp-ic"></span><b>${esc(b.titel)}</b><small>${esc(b.sub)}</small></div>`}
 if(b.k==="tutor"){return `<div class="wp-b tutor${b.offen?" offen":""}" style="${st}" onclick="wp.info('tutor','${b.id}')"><span class="wp-ic"></span><b>${esc(b.titel)}</b><small>${esc(b.sub)}</small></div>`}
 const t=b.typ,cls="wp-b plan "+t+(b.mTyp?" m-"+b.mTyp:"")+(t==="modul"&&b.mTyp?" art":"")+(b.erledigt?" done":"");
 const ic=t==="auszeit"?"":t==="eigen"?"":(MTYP[b.mTyp]?.i||"");
 return `<div class="${cls}" style="${st};--fc:${f.c};--fb:${f.bg};${t==="modul"&&b.mTyp?artStyle(b.mTyp):""}" ${b.fest?"":`draggable="true" ondragstart="wp.dragStart(event,'move','${b.id}')"`} onclick="wp.info('plan','${b.id}')"><span class="wp-ic">${ic}</span><b>${esc(b.titel)}</b><small>${esc(f.l)} · ${dauerKurz(dauerInfo(b))}</small>${b.erledigt?'<span class="wp-ok">✓</span>':""}</div>`;
}
function rasterHtml(opts){
 opts=opts||{};const w=parse(S.woche),bl=bloecke(),cov=new Set();
 bl.forEach(b=>{for(let i=0;i<(b.len||1);i++)cov.add(b.d+"-"+(b.h+i))});
 const heuteIso=iso(new Date());
 let h=`<div class="wp-grid" id="wpGrid" data-tag="${S.tag}"><div class="wp-corner"></div>`;
 for(let d=0;d<5;d++){const dt=addD(w,d),isH=iso(dt)===heuteIso;
  h+=`<div class="wp-dayh${isH?" heute":""}${d===S.tag?" tag-on":""}" style="grid-column:${d+2};grid-row:1"><b>${TAGE[d]}</b> <span>${dm(dt)}</span>${opts.teacher?"":'<em class="wp-du">Du steuerst</em>'}</div>`}
 for(let r=1;r<=10;r++){
  h+=`<div class="wp-time" style="grid-column:1;grid-row:${r+1}"><b>${r}</b><small>${esc(zeiten()[r-1]||"")}</small></div>`;
  for(let d=0;d<5;d++){if(cov.has(d+"-"+r))continue;
   h+=`<div class="wp-c${d===S.tag?" tag-on":""}" style="grid-column:${d+2};grid-row:${r+1}" ondragover="wp.over(event)" ondragleave="wp.leave(event)" ondrop="wp.drop(event,${d},${r})" onclick="wp.zelle(${d},${r})">${opts.teacher?"":lkChips(d,r)}</div>`}
 }
 bl.forEach(b=>{h+=blockHtml(b)});
 return h+"</div>";
}
function tageTabs(){const w=parse(S.woche);return `<div class="wp-tage">${TAGE.map((t,d)=>`<button class="${d===S.tag?"on":""}" onclick="wp.tag(${d})">${t} ${dm(addD(w,d))}</button>`).join("")}</div>`}
function wochenKopf(){
 return `<div class="wp-nav"><button class="secondary" onclick="wp.woche(-1)" aria-label="Vorherige Woche">←</button><b>${esc(wochenText(S.woche))}</b><button class="secondary" onclick="wp.woche(1)" aria-label="Nächste Woche">→</button>${S.woche!==heute()?`<button class="secondary" onclick="wp.woche(0)">Heute</button>`:""}</div>`;
}

/* ---------- Modulleiste ---------- */
const SONDER=[
 {typ:"termin",ic:"",t:"Fachliche Frage",s:"Lehrkraft buchen"},
 {typ:"tutor",ic:"",t:"Tutor:in buchen",s:"Mitschüler:in hilft"},
 {typ:"kompetenz",ic:"",t:"Kompetenz anfragen",s:"fürs Projekt"},
 {typ:"auszeit",ic:"",t:"Auszeit",s:"kurz regenerieren"},
 {typ:"eigen",ic:"",t:"Eigene Lernzeit",s:"selbst gewählt"}
];
function modulTile(m){
 const f=FACH(m.fach),pl=S.d.plan.eintraege.filter(e=>e.moduleId===m.id),n=pl.length,done=pl.some(e=>e.erledigt);
 const armed=S.armed&&S.armed.id===m.id;
 return `<div class="wp-tile art m-${esc(m.typ)}${n?" geplant":""}${done?" done":""}${armed?" armed":""}" style="--fc:${f.c};--fb:${f.bg};${artStyle(m.typ)}" draggable="true" ondragstart="wp.dragStart(event,'modul','${m.id}')" onclick="wp.arm('modul','${m.id}')" title="${esc(m.beschr||m.titel)}">
 <span class="wp-tic">${MTYP[m.typ]?.i||""}</span><b>${esc(m.titel)}</b><small><i class="wp-fdot" style="background:${f.c}"></i>${esc(f.l)} · ${esc(dauerKurz(dauerInfo(m)))}${m.pflicht?" · Pflicht":""}${n?" · ✓":""}</small><button type="button" class="wp-plan-btn" onclick="event.stopPropagation();wp.einplanen('modul','${m.id}')">Einplanen</button></div>`;
}
function leisteHtml(){
 /* nur frei wählbare, noch nicht eingeplante Lernbausteine (feste/automatisch gesetzte entfallen) */
 const offen=S.d.module.filter(m=>(m.fixTag==null||m.fixTag==="")&&(m.mehrfach||!S.d.plan.eintraege.some(e=>e.moduleId===m.id)));
 const fs=[...new Set(offen.map(m=>m.fach))];
 if(S.filter!=="alle"&&!fs.includes(S.filter))S.filter="alle";
 const mods=offen.filter(m=>S.filter==="alle"||m.fach===S.filter);
 let h=`<div class="wp-leiste card"><div class="wp-lh"><h3>Zum Einplanen <small>${offen.length?offen.length+" Lernbaustein"+(offen.length===1?"":"e")+" noch frei":"alles zugeordnet"}</small></h3>${artLegende(ART_SCHUELER,"")}<div class="wp-chips"><button class="${S.filter==="alle"?"on":""}" onclick="wp.filter('alle')">Alle</button>${fs.map(k=>`<button class="${S.filter===k?"on":""}" style="--fc:${FACH(k).c}" onclick="wp.filter('${k}')">${esc(FACH(k).l)}</button>`).join("")}</div></div>`;
 const sonder=SONDER.map(x=>`<div class="wp-tile sonder s-${x.typ}${S.armed&&S.armed.id===x.typ?" armed":""}" draggable="true" ondragstart="wp.dragStart(event,'sonder','${x.typ}')" onclick="wp.arm('sonder','${x.typ}')"><span class="wp-tic">${x.ic}</span><b>${x.t}</b><small>${x.s}</small><button type="button" class="wp-plan-btn" onclick="event.stopPropagation();wp.einplanen('sonder','${x.typ}')">Einplanen</button></div>`).join("");
 h+=`<p class="wp-hint wp-zieh">Ziehe einen Baustein in den Plan oder tippe auf „Einplanen“. Feste Termine und Pflichtbausteine mit festem Platz stehen schon im Plan.</p>
 <div class="wp-reihe"><button type="button" class="wp-pfeil" aria-label="nach links" onclick="wp.reiheScroll(-1)">‹</button><div class="wp-tiles1" id="wpReihe">${mods.map(modulTile).join("")}${mods.length?'<span class="wp-trenn"></span>':""}${sonder}</div><button type="button" class="wp-pfeil" aria-label="nach rechts" onclick="wp.reiheScroll(1)">›</button></div>`;
 return h+"</div>";
}
function langHtml(){
 const own=S.d.plan.eintraege.filter(e=>e.lang),fr=S.d.laufend||[];
 if(!own.length&&!fr.length)return "";
 const row=(e,fremd)=>{const I=dauerInfo(e),von=e.woche||S.woche,bis=iso(addD(parse(von),7*(I.wochen-1)));
  const zeit=I.wochen>1?"KW "+kwNr(parse(von))+"–"+kwNr(parse(bis)):(e.startTag>=0?TAGE[e.startTag]+((LANG_TAGE[I.code]||1)>1?" – "+TAGE[Math.min(4,e.startTag+LANG_TAGE[I.code]-1)]:""):"diese Woche");
  return `<div class="wp-lang art${e.erledigt?" done":""}" style="--fc:${FACH(e.fach).c};${artStyle(e.mTyp)}" ${fremd?`title="Hier abhaken: Woche ab ${esc(wochenText(von))}"`:`onclick="wp.info('plan','${e.id}')"`}><b>${esc(e.titel)}</b><small>${esc(FACH(e.fach).l)} · ${esc(I.label)} · ${esc(zeit)}${fremd?" · läuft noch":""}</small>${e.erledigt?'<span class="wp-ok">✓</span>':""}</div>`};
 return `<div class="card wp-langbox"><h3>Länger laufende Lernbausteine</h3><div class="wp-langliste">${own.map(e=>row(e,false)).join("")}${fr.map(e=>row(e,true)).join("")}</div></div>`;
}
function fortschrittHtml(){
 const k=kennzahlen(),g=Math.max(1,k.modGesamt),pDone=Math.round(k.modErledigt/g*100),pPlan=Math.round((k.modGeplant-k.modErledigt)/g*100);
 return `<div class="wp-prog card"><div class="wp-ph"><b>Fortschritt in dieser Woche</b><span>${k.modErledigt} erledigt · ${k.modGeplant} von ${k.modGesamt} Lernbausteinen eingeplant</span></div>
 <div class="wp-bar" role="img" aria-label="${k.modErledigt} erledigt, ${k.modGeplant} eingeplant von ${k.modGesamt}"><i class="d" style="width:${pDone}%"></i><i class="p" style="width:${Math.max(0,pPlan)}%"></i></div>
 <div class="wp-leg"><span><i class="d"></i>erledigt</span><span><i class="p"></i>eingeplant</span><span><i class="o"></i>noch offen</span></div></div>`;
}
function startHtml(){
 const k=kennzahlen();
 return `<div class="wp-unten"><div class="card"><h3>So startest du</h3><ol class="wp-steps"><li><b>Feste Termine ansehen.</b> Einführungen, Projekte, Lernstandsgespräche und Gruppenübungen deiner Lehrkräfte stehen schon im Plan. Die Kürzel im Raster zeigen, wann welche Lehrkraft für fachliche Fragen da ist.</li><li><b>Lernbausteine einplanen.</b> Ziehe einen Lernbaustein aus der Leiste auf einen freien Platz – oder tippe erst den Lernbaustein, dann den Platz.</li><li><b>Hilfe & Pausen mitdenken.</b> Termin, Tutor:in oder Auszeit sind eigene Bausteine.</li><li><b>Abhaken.</b> Tippe auf einen Eintrag und markiere ihn als erledigt.</li></ol></div>
 <div class="card"><h3>Meine Woche in Zahlen</h3><div class="wp-zahlen">
 <div><b>${std(k.geplantMin)}</b><small>Lernzeit geplant</small></div><div><b>${std(k.erledigtMin)}</b><small>davon erledigt</small></div>
 <div><b>${k.modGeplant}/${k.modGesamt}</b><small>Lernbausteine eingeplant</small></div><div><b>${k.checkouts}</b><small>Check-outs erledigt</small></div>
 <div><b>${k.termine+k.tutoring}</b><small>Termine & Tutoring</small></div><div><b>${k.auszeiten}</b><small>Auszeiten</small></div></div></div></div>`;
}
function ansichtSwitch(){return `<div class="wp-seg"><button class="${S.ansicht==="verplant"?"on":""}" onclick="wp.ansicht('verplant')">Verplant</button><button class="${S.ansicht==="geleistet"?"on":""}" onclick="wp.ansicht('geleistet')">✓ Geleistet</button></div>`}
function armedName(){const a=S.armed;if(!a)return "";if(a.kind==="modul")return S.d.module.find(m=>m.id===a.id)?.titel||"Lernbaustein";return SONDER.find(s=>s.typ===a.id)?.t||"Baustein"}

/* Von der Lehrkraft fest platzierte Lernbausteine (Tag + Stunde) werden automatisch in den Plan gesetzt */
async function autoPlatz(){
 let geaendert=false;const pl=S.d.plan.eintraege;
 for(const m of S.d.module){
  if(m.fixTag==null||m.fixTag===""||m.typ==="frage")continue;
  const I=dauerInfo(m),d=Number(m.fixTag),h=Number(m.fixStd)||1;
  const e=pl.find(x=>x.moduleId===m.id);
  if(I.lang){if(!e){pl.push({id:nextId(),typ:"modul",mTyp:m.typ,moduleId:m.id,titel:m.titel,fach:m.fach,d:-1,h:0,len:0,lang:true,dauer:I.code,startTag:d,woche:S.woche,fest:true,erledigt:false,route:m.route||"",link:m.link||""});geaendert=true}continue}
  if(e){if(e.fest&&(e.d!==d||e.h!==h)&&frei(d,h,I.len,e.id)){e.d=d;e.h=h;geaendert=true}continue}
  if(frei(d,h,I.len)){pl.push({id:nextId(),typ:"modul",mTyp:m.typ,moduleId:m.id,titel:m.titel,fach:m.fach,d,h,len:I.len,dauer:I.code,fest:true,erledigt:false,route:m.route||"",link:m.link||""});geaendert=true}
 }
 if(geaendert)await speichern();
}
async function schuelerHtml(){
 if(S.ansicht==="geleistet")return await geleistetHtml();
 await ladeSchueler();
 await autoPlatz();
 const wd=S.d.wochenDoc,p=S.d.plan;
 const offen=S.d.anfT.filter(a=>a.status==="offen").length;
 let h=`<div class="wp-head"><div><div class="kicker">MEINE WOCHE</div><h1>Mein Wochenplan</h1><p>Die Lehrkräfte führen ein – den Rest steuerst du selbst.</p></div><div class="wp-actions">${ansichtSwitch()}<button class="secondary" onclick="wp.inbox()">Anfragen${offen?` <span class="wp-badge">${offen}</span>`:""}</button><button class="secondary" onclick="wp.angebot()">Mein Angebot</button><button class="secondary" onclick="wp.voll()">${S.voll?"Vollbild beenden":"Vollbild"}</button></div></div>`;
 h+=`<div class="wp-bar2">${wochenKopf()}<label class="wp-ziel">Wochenziel <input id="wpZiel" maxlength="120" value="${esc(p.ziel||"")}" placeholder="Was willst du diese Woche schaffen?" onchange="wp.ziel(this.value)"></label></div>`;
 if(wd&&wd.impuls)h+=`<div class="wp-impuls"><b>Impuls deines Teams:</b> ${esc(wd.impuls)}</div>`;
 h+=persHtml();
 if(S.armed)h+=`<div class="wp-armed">Ausgewählt: <b>${esc(armedName())}</b> – tippe auf einen freien Platz im Plan. <button class="secondary" onclick="wp.arm(null)">Abbrechen</button></div>`;
 if(S.voll){
  h+=`<div class="wp-vl"><div class="wp-vl-main">${rasterHtml()}${lkLegende()}</div><div class="wp-vl-side">${langHtml()}${leisteHtml()}</div></div>`;
  return h;
 }
 h+=offenHtml()+langHtml()+tageTabs()+rasterHtml()+lkLegende()+leisteHtml()+fortschrittHtml()+startHtml()+lernplanBanner();
 h+=`<div class="card wp-rueck"><h3>Wochenrückblick <small>nur für dich</small></h3><textarea id="wpRueck" maxlength="600" rows="2" placeholder="Was lief gut? Was nehme ich mit in die nächste Woche?" onchange="wp.rueck(this.value)">${esc(p.rueckblick||"")}</textarea>
 <label class="wp-share"><input type="checkbox" ${p.geteilt?"checked":""} onchange="wp.teilen(this.checked)"> Meinen Plan dieser Woche mit meiner Lernbegleitung teilen (sonst sehen Lehrkräfte nur Kennzahlen)</label>${fb.dsHinweis()}</div>`;
 return h;
}

/* ---------- Geleistet ---------- */
async function geleistetHtml(){
 const me=uid();
 const [plaene,anfV,anfT]=await Promise.all([qdocs("wpPlan",W("uid",me)).catch(()=>[]),qdocs("wpAnfragen",W("vonUid",me)).catch(()=>[]),qdocs("wpAnfragen",W("tutorUid",me)).catch(()=>[])]);
 const alle=[];plaene.forEach(p=>(p.eintraege||[]).forEach(e=>alle.push({...e,woche:p.woche})));
 const done=alle.filter(e=>e.erledigt&&["modul","eigen"].includes(e.typ));
 const min=done.reduce((s,e)=>s+eMin(e),0),co=done.filter(e=>e.mTyp==="checkout").length;
 const geholfen=anfT.filter(a=>a.status==="angenommen").length,hilfe=anfV.filter(a=>a.status==="angenommen").length;
 const proFach={};done.forEach(e=>{proFach[e.fach]=(proFach[e.fach]||0)+eMin(e)});
 const maxF=Math.max(1,...Object.values(proFach));
 const wochen=[...new Set(plaene.map(p=>p.woche))].sort().slice(-12);
 const proWoche=wochen.map(w=>({w,m:done.filter(e=>e.woche===w).reduce((s,e)=>s+eMin(e),0)}));const maxW=Math.max(1,...proWoche.map(x=>x.m));
 let h=`<div class="wp-head"><div><div class="kicker">MEINE WOCHE</div><h1>Das habe ich geleistet</h1><p>Alles, was du abgehakt hast – über alle Wochen.</p></div><div class="wp-actions">${ansichtSwitch()}</div></div>`;
 h+=`<div class="wp-kpis"><div class="card"><b>${done.length}</b><small>erledigte Lernbausteine & Lernzeiten</small></div><div class="card"><b>${std(min)}</b><small>Lernzeit insgesamt</small></div><div class="card"><b>${co}</b><small>Check-outs</small></div><div class="card"><b>${geholfen}</b><small>Mal geholfen (Tutor:in / Kompetenz)</small></div><div class="card"><b>${hilfe}</b><small>Mal Hilfe bekommen</small></div></div>`;
 h+=`<div class="wp-unten"><div class="card"><h3>Lernzeit nach Fächern</h3>${Object.keys(proFach).length?Object.keys(proFach).sort((a,b)=>proFach[b]-proFach[a]).map(k=>`<div class="wp-hbar"><span>${esc(FACH(k).l)}</span><div><i style="width:${Math.round(proFach[k]/maxF*100)}%;background:${FACH(k).c}"></i></div><em>${std(proFach[k])}</em></div>`).join(""):`<p class="wp-leer">Noch nichts abgehakt – sobald du Einträge als erledigt markierst, erscheinen sie hier.</p>`}</div>
 <div class="card"><h3>Lernzeit pro Woche</h3>${proWoche.length?`<div class="wp-wbars">${proWoche.map(x=>`<div title="${esc(wochenText(x.w))}"><i style="height:${Math.round(x.m/maxW*100)}%"></i><small>KW${kwNr(parse(x.w))}</small></div>`).join("")}</div>`:`<p class="wp-leer">Noch keine Wochen.</p>`}</div></div>`;
 const letzte=done.sort((a,b)=>String(b.woche).localeCompare(String(a.woche))||b.d-a.d).slice(0,15);
 h+=`<div class="card"><h3>Zuletzt erledigt</h3>${letzte.length?`<div class="wp-liste">${letzte.map(e=>`<div><span class="wp-fl" style="--fc:${FACH(e.fach).c};--fb:${FACH(e.fach).bg}">${esc(FACH(e.fach).l)}</span><b>${esc(e.titel)}</b><small>${esc(wochenText(e.woche))} · ${e.lang?esc(dauerInfo(e).label):TAGE[e.d]+" · "+dauerKurz(dauerInfo(e))}</small></div>`).join("")}</div>`:`<p class="wp-leer">Noch nichts erledigt.</p>`}</div>`;
 return h;
}

/* =========================================================
   AKTIONEN (Schüler:innen)
   ========================================================= */
async function inhalt(){
 try{return isT()?await lehrerHtml():await schuelerHtml()}
 catch(e){console.error("Wochenplan:",e);return `<div class="card"><h3>Der Wochenplan konnte nicht geladen werden.</h3><p>${esc(e?.code==="permission-denied"?"Dafür fehlt die Berechtigung – bitte firestore.rules in der Firebase-Konsole veröffentlichen.":(e?.message||"Unbekannter Fehler"))}</p></div>`}
}
function vollSetzen(an){
 if(isT())return;
 S.voll=!!an;const r=$("wpRoot");if(r)r.classList.toggle("wp-voll",S.voll);
 document.body.classList.toggle("wp-voll-body",S.voll);
 neu();
}
if(!window.__wpEsc){window.__wpEsc=1;document.addEventListener("keydown",e=>{if(e.key==="Escape"&&S.voll&&document.getElementById("modalBackdrop")?.hidden!==false)vollSetzen(false)})}
async function neu(){const r=$("wpRoot");if(!r)return;const y=window.scrollY;r.innerHTML=await inhalt();window.scrollTo(0,y)}
const modalOpen=h=>fb.modal(`<button class="modal-close" onclick="closeModal()">×</button>${h}`);
const nextId=()=>nid();

function payloadVon(ev){try{return JSON.parse(ev.dataTransfer.getData("text/plain"))}catch(e){return S.drag||null}}

async function setze(pl,d,h){
 if(!pl)return;
 if(pl.kind==="move"){
  const e=S.d.plan.eintraege.find(x=>x.id===pl.id);if(!e)return;
  if(e.fest)return fb.toast("Dieser Lernbaustein hat einen festen Termin.");
  if(!frei(d,h,e.len||1,e.id))return fb.toast("Dort ist nicht genug Platz.");
  e.d=d;e.h=h;await speichern();return neu();
 }
 if(pl.kind==="offen"){
  const o=(S.d.offen||[]).find(x=>x.id===pl.id);if(!o)return;
  const I=dauerInfo(o),{vonWoche:_vw,note:_n,doneAt:_da,...oc}=o;
  if(I.lang)S.d.plan.eintraege.push({...oc,id:nextId(),d:-1,h:0,len:0,startTag:d,woche:S.woche,erledigt:false,uebertrag:true});
  else{if(!frei(d,h,I.len))return fb.toast(I.len>1?"Dafür brauchst du "+I.len+" freie Stunden hintereinander.":"Dieser Platz ist schon belegt.");S.d.plan.eintraege.push({...oc,id:nextId(),d,h,len:I.len,woche:S.woche,erledigt:false,uebertrag:true})}
  S.d.offen=S.d.offen.filter(x=>x.id!==pl.id);
  await speichern();fb.toast("Eingeplant.");return neu();
 }
 if(pl.kind==="modul"){
  const m=S.d.module.find(x=>x.id===pl.id);if(!m)return;
  if(m.typ==="frage"){S.armed=null;return modalTermin(d,h)}
  const I=dauerInfo(m);
  const schon=S.d.plan.eintraege.find(e=>e.moduleId===m.id);
  if(schon&&!m.mehrfach){
   if(I.lang)return fb.toast("Dieser Lernbaustein ist schon eingeplant.");
   if(!frei(d,h,schon.len||1,schon.id))return fb.toast("Dort ist nicht genug Platz.");
   schon.d=d;schon.h=h;await speichern();fb.toast("Lernbaustein verschoben.");return neu();
  }
  if(I.lang){
   S.d.plan.eintraege.push({id:nextId(),typ:"modul",mTyp:m.typ,moduleId:m.id,titel:m.titel,fach:m.fach,d:-1,h:0,len:0,lang:true,dauer:I.code,startTag:d,woche:S.woche,erledigt:false,route:m.route||"",link:m.link||""});
   await speichern();fb.toast("Eingeplant: "+I.label+".");return neu();
  }
  if(!frei(d,h,I.len))return fb.toast(I.len>1?"Für diesen Lernbaustein brauchst du "+I.len+" freie Stunden hintereinander.":"Dieser Platz ist schon belegt.");
  S.d.plan.eintraege.push({id:nextId(),typ:"modul",mTyp:m.typ,moduleId:m.id,titel:m.titel,fach:m.fach,d,h,len:I.len,dauer:I.code,erledigt:false,route:m.route||"",link:m.link||""});
  await speichern();return neu();
 }
 if(pl.kind==="sonder"){
  if(pl.id==="termin")return modalTermin(d,h);
  if(pl.id==="tutor"||pl.id==="kompetenz")return modalTutor(pl.id,d,h);
  if(pl.id==="auszeit")return modalAuszeit(d,h);
  if(pl.id==="eigen")return modalEigen(d,h);
 }
}
function kuerzel(s){
 if(s&&s.kuerzel)return s.kuerzel;
 const w=String((s&&s.lehrkraft)||"Lk").replace(/\b(Frau|Herr|Dr\.?|Prof\.?|StR|OStR|StRin)\b/gi,"").trim().split(/\s+/).filter(Boolean);
 return (w[w.length-1]||"Lk").slice(0,3).toUpperCase();
}
function lkChips(d,r){
 return (S.d.slots||[]).filter(x=>x.d===d&&x.h<=r&&r<x.h+(x.len||1)).map(x=>{const bel=S.d.belegt.has(x.id),mein=S.d.buch.some(b=>b.id===x.id);
  return `<button type="button" class="wp-lk${bel?" bel":""}${mein?" mein":""}" title="${esc((x.lehrkraft||"Lehrkraft")+" · "+FACH(x.fach).l+(bel?" · vergeben":" · anwesend, für fachliche Fragen buchbar"))}" onclick="event.stopPropagation();wp.slotModal('${x.id}')">${esc(kuerzel(x))}</button>`}).join("");
}
function lkLegende(){
 const sl=S.d.slots||[];if(!sl.length)return "";
 const m=new Map();sl.forEach(x=>{const k=kuerzel(x);if(!m.has(k))m.set(k,(x.lehrkraft||"Lehrkraft"))});
 return `<div class="wp-lkleg"><b>Lehrkräfte im Plan:</b> ${[...m].map(([k,n])=>`<span><i class="wp-lk">${esc(k)}</i> ${esc(n)}</span>`).join("")}<small>Tippe auf ein Kürzel, um die Lehrkraft für eine fachliche Frage zu buchen.</small></div>`;
}
function slotModal(id){
 const s=S.d.slots.find(x=>x.id===id);if(!s)return;
 const bel=S.d.belegt.has(s.id),mein=S.d.buch.some(b=>b.id===s.id),platz=frei(s.d,s.h,s.len||1),eigene=S.d.buch.length;
 modalOpen(`<div class="wp-artband" style="${artStyle("frage")}">Fachliche Frage</div><div class="kicker">${esc(FACH(s.fach).l)}</div><h2>${esc(s.lehrkraft||"Lehrkraft")} (${esc(kuerzel(s))})</h2><p>${TAGEL[s.d]}, ${esc(dm(addD(parse(S.woche),s.d)))} · ${esc(zeitBereich(s.h,s.len||1))}</p>
 ${mein?'<p class="wp-hint">Diesen Termin hast du gebucht.</p>':bel?'<p class="wp-hint">Dieser Termin ist schon vergeben.</p>':!platz?'<p class="wp-hint">Bei dir ist zu dieser Zeit schon etwas geplant.</p>':`<label class="form"><span>Deine Frage (kurz)</span><textarea id="wpFrage" maxlength="200" rows="2" placeholder="Worum geht es?"></textarea></label>${fb.dsHinweis()}${eigene>=2?'<p class="wp-warn">Du hast diese Woche schon 2 Termine gebucht. Sage erst einen ab.</p>':""}`}
 <div class="form-actions"><button class="secondary" onclick="closeModal()">Schließen</button>${!mein&&!bel&&platz?`<button class="primary" ${eigene>=2?"disabled":""} onclick="wp.buche('${s.id}')">Buchen</button>`:""}</div>`);
}
function einplanen(kind,id){
 if(isT())return;
 const m=kind==="modul"?S.d.module.find(x=>x.id===id):kind==="offen"?(S.d.offen||[]).find(x=>x.id===id):null;
 const I=m?dauerInfo(m):{lang:false,len:1};
 const titel=(kind==="modul"||kind==="offen")?(m?m.titel:"Lernbaustein"):(SONDER.find(x=>x.typ===id)?.t||"Baustein");
 const w=parse(S.woche);
 const tage=TAGEL.map((t,d)=>`<option value="${d}" ${d===S.tag?"selected":""}>${t}, ${dm(addD(w,d))}</option>`).join("");
 const std=[...Array(10)].map((_,i)=>`<option value="${i+1}">${i+1}. Stunde (${esc(zeiten()[i]||"")})</option>`).join("");
 modalOpen(`<div class="wp-artband" style="${artStyle('einfuehrung')}">Einplanen</div><div class="kicker">EINPLANEN</div><h2>${esc(titel)}</h2><div class="form">
  <label>Tag<select id="epTag">${tage}</select></label>
  ${I.lang?"":`<label>Beginn<select id="epStd">${std}</select></label>`}
  <div class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button><button class="primary" onclick="wp.einplanenOk('${kind}','${id}')">Einplanen</button></div></div>`);
 const sel=$("epStd");if(sel){const len=I.len||1;const fr=[...sel.options].find(o=>frei(S.tag,Number(o.value),len));if(fr)sel.value=fr.value}
}
function einplanenOk(kind,id){
 const d=Number($("epTag").value),h=Number($("epStd")?.value||1);
 fb.closeModal();S.armed=null;setze({kind,id},d,h);
}
function modalAuszeit(d,h){
 modalOpen(`<div class="wp-artband" style="${artStyle('vertiefung')}">Auszeit</div><div class="kicker">AUSZEIT</div><h2>Kurze Auszeit einplanen</h2><p>Regeneration gehört zum Lernen. Deine Auszeiten sind <b>nur für dich</b> sichtbar und zählen nicht in der Statistik der Lehrkräfte.</p>
 <div class="form"><label>Was tut dir gut?<select id="azArt">${AUSZEIT_ARTEN.map(a=>`<option value="${a[0]}">${a[1]}</option>`).join("")}</select></label>
 <label>Dauer<select id="azLen"><option value="1">45 Minuten</option>${frei(d,h,2)?'<option value="2">90 Minuten</option>':""}</select></label>
 <div class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button><button class="primary" onclick="wp.auszeitSetzen(${d},${h})">Einplanen</button></div></div>`);
}
async function auszeitSetzen(d,h){
 const art=$("azArt").value,len=Number($("azLen").value)||1,t=AUSZEIT_ARTEN.find(a=>a[0]===art)[1];
 if(!frei(d,h,len))return fb.toast("Dort ist nicht genug Platz.");
 S.d.plan.eintraege.push({id:nextId(),typ:"auszeit",titel:"Auszeit: "+t,fach:"fachuebergreifend",d,h,len,erledigt:false,route:"resilienz"});
 fb.closeModal();await speichern();neu();
}
function modalEigen(d,h){
 modalOpen(`<div class="wp-artband" style="${artStyle('eigen')}">Eigene Lernzeit</div><div class="kicker">EIGENE LERNZEIT</div><h2>Eigene Lernzeit einplanen</h2>
 <div class="form"><label>Was willst du tun?<input id="egTitel" maxlength="60" placeholder="z. B. Vokabeln wiederholen"></label>
 <label>Fach<select id="egFach">${FAECHER.map(f=>`<option value="${f.k}">${esc(f.l)}</option>`).join("")}</select></label>
 <label>Dauer (auch länger, z. B. für eine Prüfungsvorbereitung)<select id="egLen">${DAUER_EIGEN.filter(o=>LANG_WOCHEN[o[0]]||frei(d,h,dauerInfo({dauer:o[0]}).len)).map(o=>`<option value="${o[0]}" ${o[0]==="45"?"selected":""}>${o[1]}${LANG_WOCHEN[o[0]]?" (Zeitraum)":""}</option>`).join("")}</select></label>${fb.dsHinweis()}
 <div class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button><button class="primary" onclick="wp.eigenSetzen(${d},${h})">Einplanen</button></div></div>`);
}
async function eigenSetzen(d,h){
 const t=$("egTitel").value.trim();if(t.length<2)return fb.toast("Bitte beschreibe kurz, was du tun willst.");
 const I=dauerInfo({dauer:$("egLen").value});
 if(I.lang){S.d.plan.eintraege.push({id:nextId(),typ:"eigen",mTyp:"eigen",titel:t,fach:$("egFach").value,d:-1,h:0,len:0,lang:true,dauer:I.code,startTag:d,woche:S.woche,erledigt:false});fb.closeModal();await speichern();return neu()}
 if(!frei(d,h,I.len))return fb.toast("Dort ist nicht genug Platz.");
 S.d.plan.eintraege.push({id:nextId(),typ:"eigen",titel:t,fach:$("egFach").value,d,h,len:I.len,dauer:I.code,erledigt:false});
 fb.closeModal();await speichern();neu();
}
/* ---------- Termin bei Lehrkraft ---------- */
function modalTermin(d,h){
 const me=uid(),eigene=S.d.buch.length;
 const sl=[...S.d.slots].sort((a,b)=>((a.d===d&&a.h===h)?0:1)-((b.d===d&&b.h===h)?0:1)||a.d-b.d||a.h-b.h);
 modalOpen(`<div class="wp-artband" style="${artStyle('frage')}">Fachliche Frage</div><div class="kicker">TERMIN BEI EINER LEHRKRAFT</div><h2>Fachliche Frage klären</h2><p>Wähle einen freien Termin. Die Lehrkraft sieht dein Pseudonym und deine Frage – sonst niemand.</p>
 <label class="form"><span>Deine Frage (kurz)</span><textarea id="wpFrage" maxlength="200" rows="2" placeholder="Worum geht es? z. B. „Aufgabe 3 zur Gleichung – wie komme ich auf den Ansatz?“"></textarea></label>${fb.dsHinweis()}
 ${eigene>=2?'<p class="wp-warn">Du hast diese Woche schon 2 Termine gebucht. Sage erst einen ab, wenn du einen weiteren möchtest.</p>':""}
 <div class="wp-slotliste">${sl.length?sl.map(s=>{
  const bel=S.d.belegt.has(s.id),mein=S.d.buch.some(b=>b.id===s.id),platz=frei(s.d,s.h,s.len||1);
  return `<div class="wp-slot${bel?" bel":""}"><div><b>${TAGEL[s.d]}, ${esc(dm(addD(parse(S.woche),s.d)))} · ${esc(zeitBereich(s.h,s.len||1))}</b><small>${esc(s.lehrkraft||"Lehrkraft")} · ${esc(FACH(s.fach).l)}</small></div>
  ${mein?'<span class="pill">gebucht</span>':bel?'<span class="pill">vergeben</span>':!platz?'<span class="pill">bei dir belegt</span>':`<button class="primary" ${eigene>=2?"disabled":""} onclick="wp.buche('${s.id}')">Buchen</button>`}</div>`}).join(""):'<p class="wp-leer">Für diese Woche hat noch keine Lehrkraft Termine angeboten.</p>'}</div>
 <div class="form-actions"><button class="secondary" onclick="closeModal()">Schließen</button><button class="primary" onclick="wp.frageVormerken(${d},${h})" title="Reserviert dir die Lernzeit im Plan, auch wenn noch kein Termin frei ist">Einplanen</button></div>
 <small class="wp-hint">„Einplanen“ legt die Zeit für deine Frage in deinen Plan. Sobald eine Lehrkraft Termine anbietet, kannst du hier buchen.</small>`);
}
async function frageVormerken(d,h){
 if(!frei(d,h,1))return fb.toast("Dieser Platz ist schon belegt.");
 const f=($("wpFrage")?.value||"").trim().slice(0,100);
 S.d.plan.eintraege.push({id:nextId(),typ:"eigen",mTyp:"frage",titel:f?"Frage: "+f:"Fachliche Frage klären",fach:"fachuebergreifend",d,h,len:1,dauer:"45",woche:S.woche,erledigt:false});
 fb.closeModal();await speichern();fb.toast("Eingeplant.");neu();
}
async function buche(slotId){
 const s=S.d.slots.find(x=>x.id===slotId);if(!s)return;
 const frage=($("wpFrage")?.value||"").trim();if(frage.length<5)return fb.toast("Bitte formuliere kurz deine Frage (mind. 5 Zeichen).");
 if(!frei(s.d,s.h,s.len||1))return fb.toast("Bei dir ist zu dieser Zeit schon etwas geplant.");
 try{
  const b=fb.writeBatch(fb.db);
  b.set(ref("wpBuchungen",s.id),{slotId:s.id,uid:uid(),pseudo:pseudo(),woche:S.woche,d:s.d,h:s.h,len:s.len||1,lehrkraft:s.lehrkraft||"",fach:s.fach||"fachuebergreifend",frage,createdAt:fb.serverTimestamp()});
  b.set(ref("wpBelegt",s.id),{slotId:s.id,createdAt:fb.serverTimestamp()});
  await b.commit();fb.closeModal();fb.toast("Termin gebucht.");neu();
 }catch(e){console.error(e);fb.toast("Dieser Termin ist leider inzwischen vergeben.");fb.closeModal();neu()}
}
async function terminAbsagen(slotId){
 if(!confirm("Diesen Termin absagen?"))return;
 try{const b=fb.writeBatch(fb.db);b.delete(ref("wpBuchungen",slotId));b.delete(ref("wpBelegt",slotId));await b.commit();fb.closeModal();fb.toast("Termin abgesagt.");neu()}
 catch(e){console.error(e);fb.toast("Absagen nicht möglich.")}
}
/* ---------- Tutor:in / Kompetenz ---------- */
function modalTutor(art,d,h){
 const me=uid(),isK=art==="kompetenz";
 const of=S.d.tutoren.filter(t=>t.art===art&&t.uid!==me);
 modalOpen(`<div class="wp-artband" style="${artStyle('projekt')}">${isK?"Kompetenz anfragen":"Tutoring"}</div><div class="kicker">${isK?"KOMPETENZ ANFRAGEN":"TUTOR:IN BUCHEN"}</div><h2>${isK?"Wer kann dir im Projekt helfen?":"Wer erklärt dir etwas?"}</h2>
 <p>${isK?"Hier findest du Stärken aus der Kompetenzwerkstatt deiner Mitschüler:innen.":"Mitschüler:innen, die anderen ein Thema erklären."} Der Termin liegt am <b>${TAGEL[d]}, ${esc(zeitBereich(h,1))}</b>. Die Person muss die Anfrage annehmen.</p>
 <div class="form"><label>${isK?"Wobei brauchst du Unterstützung?":"Welches Thema?"}<input id="tuThema" maxlength="100"></label>
 ${isK?`<label>Projekt (optional)<input id="tuProjekt" maxlength="80" placeholder="z. B. BEP in Aktion – Team 2"></label>`:""}
 <label>Dauer<select id="tuLen"><option value="1">45 Minuten</option>${frei(d,h,2)?'<option value="2">90 Minuten</option>':""}</select></label>${fb.dsHinweis()}</div>
 <div class="wp-slotliste">${of.length?of.map(t=>`<div class="wp-slot"><div><b>${esc(t.pseudo)}</b><small>${esc(isK?t.bereich:FACH(t.fach).l+" · "+t.bereich)}${t.beschr?" – "+esc(t.beschr):""}</small></div><button class="primary" onclick="wp.anfrage('${t.id}',${d},${h})">Anfragen</button></div>`).join(""):'<p class="wp-leer">Noch niemand hat ein Angebot eingestellt. Tipp: Biete selbst etwas an (Knopf „Mein Angebot“).</p>'}</div>
 <div class="form-actions"><button class="secondary" onclick="closeModal()">Schließen</button></div>`);
}
async function anfrage(offerId,d,h){
 const t=S.d.tutoren.find(x=>x.id===offerId);if(!t)return;
 const thema=($("tuThema")?.value||"").trim();if(thema.length<3)return fb.toast("Bitte nenne kurz das Thema.");
 const len=Number($("tuLen").value)||1;if(!frei(d,h,len))return fb.toast("Bei dir ist zu dieser Zeit schon etwas geplant.");
 try{
  await fb.addDoc(col("wpAnfragen"),{vonUid:uid(),vonPseudo:pseudo(),tutorUid:t.uid,tutorPseudo:t.pseudo,art:t.art,fach:t.fach||"fachuebergreifend",bereich:t.bereich||"",thema,projekt:($("tuProjekt")?.value||"").trim(),woche:S.woche,d,h,len,status:"offen",createdAt:fb.serverTimestamp(),updatedAt:fb.serverTimestamp()});
  fb.closeModal();fb.toast("Anfrage gesendet.");neu();
 }catch(e){console.error(e);fb.toast("Anfrage nicht möglich.")}
}
function inbox(){
 const w=S.woche,t=S.d.anfT.filter(a=>a.woche===w),v=S.d.anfV.filter(a=>a.woche===w);
 const andere=S.d.anfT.filter(a=>a.woche!==w&&a.status==="offen").length;
 const lbl={offen:"wartet",angenommen:"angenommen",abgelehnt:"abgelehnt",zurueckgezogen:"zurückgezogen"};
 modalOpen(`<div class="wp-artband" style="${artStyle('baustein')}">Anfragen</div><div class="kicker">ANFRAGEN · ${esc(wochenText(w))}</div><h2>Anfragen an dich</h2>
 ${t.length?t.map(a=>`<div class="wp-slot"><div><b>${esc(a.vonPseudo)} · ${a.art==="kompetenz"?"Kompetenz":"Tutoring"}</b><small>${TAGE[a.d]} ${esc(zeitBereich(a.h,a.len||1))} · ${esc(a.thema)}${a.projekt?" · Projekt: "+esc(a.projekt):""}</small></div>
  ${a.status==="offen"?`<span><button class="primary" onclick="wp.antwort('${a.id}',true)">Annehmen</button> <button class="secondary" onclick="wp.antwort('${a.id}',false)">Ablehnen</button></span>`:`<span class="pill">${lbl[a.status]||a.status}</span>`}</div>`).join(""):'<p class="wp-leer">Keine Anfragen in dieser Woche.</p>'}
 ${andere?`<p class="wp-hint">${andere} offene Anfrage(n) in anderen Wochen – wechsle die Woche, um sie zu beantworten.</p>`:""}
 <h3>Meine Anfragen</h3>
 ${v.length?v.map(a=>`<div class="wp-slot"><div><b>${esc(a.tutorPseudo)} · ${a.art==="kompetenz"?"Kompetenz":"Tutoring"}</b><small>${TAGE[a.d]} ${esc(zeitBereich(a.h,a.len||1))} · ${esc(a.thema)}</small></div><span><span class="pill">${lbl[a.status]||a.status}</span>${["offen","angenommen"].includes(a.status)?` <button class="secondary" onclick="wp.zurueckziehen('${a.id}')">Zurückziehen</button>`:""}</span></div>`).join(""):'<p class="wp-leer">Du hast in dieser Woche nichts angefragt.</p>'}
 <div class="form-actions"><button class="secondary" onclick="closeModal()">Schließen</button></div>`);
}
async function antwort(id,ja){
 const a=S.d.anfT.find(x=>x.id===id);if(!a)return;
 if(ja&&!frei(a.d,a.h,a.len||1))return fb.toast("Du hast zu dieser Zeit schon etwas geplant. Verschiebe erst deinen Eintrag.");
 try{await fb.updateDoc(ref("wpAnfragen",id),{status:ja?"angenommen":"abgelehnt",updatedAt:fb.serverTimestamp()});fb.closeModal();fb.toast(ja?"Angenommen – der Termin steht in euren Plänen.":"Abgelehnt.");neu()}
 catch(e){console.error(e);fb.toast("Antwort nicht möglich.")}
}
async function zurueckziehen(id){
 try{await fb.updateDoc(ref("wpAnfragen",id),{status:"zurueckgezogen",updatedAt:fb.serverTimestamp()});fb.closeModal();neu()}catch(e){console.error(e);fb.toast("Nicht möglich.")}
}
/* ---------- Mein Angebot ---------- */
function angebot(){
 const me=uid(),mine=S.d.tutoren.filter(t=>t.uid===me);
 modalOpen(`<div class="wp-artband" style="${artStyle('baustein')}">Mein Angebot</div><div class="kicker">MEIN ANGEBOT</div><h2>Anderen helfen</h2><p>Hier entscheidest du, wobei du Mitschüler:innen unterstützen möchtest. Dein Angebot sehen alle in der Klasse – mit deinem Pseudonym.</p>
 <h3>Meine Angebote</h3>${mine.length?mine.map(t=>`<div class="wp-slot"><div><b>${t.art==="kompetenz"?"Kompetenz":"Tutor:in"}: ${esc(t.bereich)}</b><small>${t.art==="tutor"?esc(FACH(t.fach).l)+" · ":""}${esc(t.beschr||"")}</small></div><button class="secondary" onclick="wp.angebotWeg('${t.id}')">Löschen</button></div>`).join(""):'<p class="wp-leer">Noch kein Angebot.</p>'}
 <h3>Neues Angebot</h3><div class="form">
 <label>Art<select id="agArt" onchange="document.getElementById('agFachBox').hidden=this.value!=='tutor'"><option value="tutor">Tutor:in in einem Fach</option><option value="kompetenz">Kompetenz (z. B. Excel, Zeichnen, Moderieren)</option></select></label>
 <label id="agFachBox">Fach<select id="agFach">${FAECHER.slice(0,7).map(f=>`<option value="${f.k}">${esc(f.l)}</option>`).join("")}</select></label>
 <label>Thema / Kompetenz<input id="agBereich" maxlength="60" placeholder="z. B. Gleichungen, Textanalyse, Präsentationen"></label>
 <label>Kurzbeschreibung (optional)<input id="agBeschr" maxlength="120"></label>${fb.dsHinweis()}
 <div class="form-actions"><button class="secondary" onclick="wp.ausKompetenzwerkstatt()">Aus meiner Kompetenzwerkstatt übernehmen</button><button class="primary" onclick="wp.angebotNeu()">Veröffentlichen</button></div></div>
 <div class="form-actions"><button class="secondary" onclick="closeModal()">Schließen</button></div>`);
}
async function angebotNeu(){
 const art=$("agArt").value,bereich=$("agBereich").value.trim();if(bereich.length<2)return fb.toast("Bitte nenne ein Thema bzw. eine Kompetenz.");
 try{await fb.addDoc(col("wpTutor"),{uid:uid(),pseudo:pseudo(),art,fach:art==="tutor"?$("agFach").value:"fachuebergreifend",bereich,beschr:$("agBeschr").value.trim(),createdAt:fb.serverTimestamp()});
  S.d.tutoren=await qdocs("wpTutor");angebot();fb.toast("Angebot veröffentlicht.")}catch(e){console.error(e);fb.toast("Nicht möglich.")}
}
async function angebotWeg(id){try{await fb.deleteDoc(ref("wpTutor",id));S.d.tutoren=S.d.tutoren.filter(t=>t.id!==id);angebot()}catch(e){fb.toast("Nicht möglich.")}}
async function ausKompetenzwerkstatt(){
 try{
  const l=(await qdocs("competencies",W("uid",uid()))).filter(c=>c.canHelp);
  if(!l.length)return fb.toast("In deiner Kompetenzwerkstatt ist nichts mit „Ich kann helfen“ markiert.");
  const schon=new Set(S.d.tutoren.filter(t=>t.uid===uid()).map(t=>t.bereich));let n=0;
  for(const c of l){if(schon.has(c.name))continue;await fb.addDoc(col("wpTutor"),{uid:uid(),pseudo:pseudo(),art:"kompetenz",fach:"fachuebergreifend",bereich:String(c.name).slice(0,60),beschr:String(c.helpText||"").slice(0,120),createdAt:fb.serverTimestamp()});n++}
  S.d.tutoren=await qdocs("wpTutor");angebot();fb.toast(n+" Angebot(e) übernommen.");
 }catch(e){console.error(e);fb.toast("Übernehmen nicht möglich.")}
}
/* ---------- Eintrag ansehen ---------- */
function info(kind,id){
 if(kind==="einf"){const e=S.d.einf.find(x=>x.id===id);if(!e)return;
  return modalOpen(`<div class="wp-artband" style="${artStyle(artKey(e.art))}">${esc(tart(e).l)}</div><div class="kicker">${esc(FACH(e.fach).l)}</div><h2>${esc(e.titel)}</h2><p>${TAGEL[e.d]}, ${esc(zeitBereich(e.h,e.len||1))}${e.lehrkraft?" · "+esc(e.lehrkraft):""}${e.raum?" · Raum "+esc(e.raum):""}</p><p class="wp-hint">${tart(e).hint}</p>${anhHtml(e.anhaenge)}<div class="form-actions"><button class="secondary" onclick="closeModal()">Schließen</button></div>`)}
 if(kind==="gesp")return infoGesp(id);
 if(kind==="termin"){const b=S.d.buch.find(x=>x.id===id);if(!b)return;
  return modalOpen(`<div class="wp-artband" style="${artStyle('frage')}">Termin bei einer Lehrkraft</div><div class="kicker">MEIN TERMIN</div><h2>${esc(b.lehrkraft||"Lehrkraft")}</h2><p>${TAGEL[b.d]}, ${esc(zeitBereich(b.h,b.len||1))}</p><p><b>Meine Frage:</b> ${esc(b.frage)}</p><div class="form-actions"><button class="secondary" onclick="wp.terminAbsagen('${b.id}')">Termin absagen</button><button class="primary" onclick="closeModal()">Schließen</button></div>`)}
 if(kind==="tutor"){const a=[...S.d.anfV,...S.d.anfT].find(x=>x.id===id);if(!a)return;const ich=a.tutorUid===uid();
  return modalOpen(`<div class="wp-artband" style="${artStyle('projekt')}">${a.art==="kompetenz"?"Kompetenz":"Tutoring"}</div><div class="kicker">${a.art==="kompetenz"?"KOMPETENZ":"TUTORING"} · ${a.status==="offen"?"ANGEFRAGT":"BESTÄTIGT"}</div><h2>${esc(ich?a.vonPseudo:a.tutorPseudo)}</h2><p>${TAGEL[a.d]}, ${esc(zeitBereich(a.h,a.len||1))}</p><p><b>Thema:</b> ${esc(a.thema)}${a.projekt?"<br><b>Projekt:</b> "+esc(a.projekt):""}</p><div class="form-actions"><button class="secondary" onclick="wp.zurueckziehen('${a.id}')">${ich?"Absagen":"Zurückziehen"}</button><button class="primary" onclick="closeModal()">Schließen</button></div>`)}
 const e=S.d.plan.eintraege.find(x=>x.id===id);if(!e)return;
 const m=e.moduleId?S.d.module.find(x=>x.id===e.moduleId):null;
 const ziel=e.route?`<button class="secondary" onclick="closeModal();go('${esc(e.route)}')">Öffnen</button>`:(e.link&&/^https:\/\//.test(e.link)?`<a class="secondary btn" href="${esc(e.link)}" target="_blank" rel="noopener">Link öffnen</a>`:"");
 const I=dauerInfo(e);
 modalOpen(`${e.mTyp?`<div class="wp-artband" style="${artStyle(e.mTyp)}">${esc(artOf(e.mTyp).l)}</div>`:""}<div class="kicker">${esc(FACH(e.fach).l)} · ${esc(dauerKurz(I))}</div><h2>${esc(e.titel)}</h2><p>${I.lang?esc(I.label):TAGEL[e.d]+", "+esc(zeitBereich(e.h,e.len||1))}</p>${m&&m.beschr?`<p>${esc(m.beschr)}</p>`:""}${gestaltungHtml(m)}${rallyKnopf(e,m)}${fbKnopf(e,m)}${e.fest?`<p class="wp-hint">Fester Termin deiner Lehrkraft – dieser Lernbaustein ist für dich schon eingeplant.</p>`:""}${anhHtml(m&&m.anhaenge)}
 <label class="form"><span>Notiz (nur für dich)</span><textarea id="wpNotiz" rows="2" maxlength="300" onchange="wp.notiz('${e.id}',this.value)">${esc(e.note||"")}</textarea></label>
 <div class="form-actions">${e.fest?"":`<button class="secondary" onclick="wp.entfernen('${e.id}')">Aus Plan nehmen</button>`}${ziel}<button class="primary" onclick="wp.erledigt('${e.id}')">${e.erledigt?"Wieder öffnen":"✓ Erledigt"}</button></div>`);
}
async function erledigt(id){const e=S.d.plan.eintraege.find(x=>x.id===id);if(!e)return;e.erledigt=!e.erledigt;e.doneAt=e.erledigt?Date.now():null;fb.closeModal();await speichern();if(e.erledigt)fb.toast("Stark – abgehakt!");neu()}
async function entfernen(id){S.d.plan.eintraege=S.d.plan.eintraege.filter(x=>x.id!==id);fb.closeModal();await speichern();neu()}
async function notiz(id,t){const e=S.d.plan.eintraege.find(x=>x.id===id);if(!e)return;e.note=String(t).slice(0,300);await speichern()}

const wpPublic={
 woche:async n=>{S.woche=n===0?heute():iso(addD(parse(S.woche),7*n));S.armed=null;neu()},
 tag:d=>{S.tag=d;neu()},
 ansicht:a=>{S.ansicht=a;neu()},
 filter:k=>{S.filter=k;neu()},
 arm:(kind,id)=>{if(!kind||(S.armed&&S.armed.id===id)){S.armed=null}else{S.armed={kind,id}}neu().then(()=>{if(S.armed)$("wpGrid")?.scrollIntoView({behavior:"smooth",block:"start"})})},
 dragStart:(ev,kind,id)=>{S.drag={kind,id};try{ev.dataTransfer.setData("text/plain",JSON.stringify(S.drag));ev.dataTransfer.effectAllowed="move"}catch(e){}},
 over:ev=>{ev.preventDefault();ev.currentTarget.classList.add("over")},
 leave:ev=>ev.currentTarget.classList.remove("over"),
 drop:(ev,d,h)=>{ev.preventDefault();ev.currentTarget.classList.remove("over");const pl=payloadVon(ev);S.drag=null;S.armed=null;setze(pl,d,h)},
 zelle:(d,h)=>{if(isT())return teacherZelle(d,h);if(S.armed){const a=S.armed;S.armed=null;setze({kind:a.kind,id:a.id},d,h)}},
 info,erledigt,entfernen,notiz,buche,terminAbsagen,anfrage,inbox,antwort,zurueckziehen,angebot,angebotNeu,angebotWeg,ausKompetenzwerkstatt,auszeitSetzen,eigenSetzen,
 ziel:async t=>{S.d.plan.ziel=String(t).slice(0,120);await speichern()},
 rueck:async t=>{S.d.plan.rueckblick=String(t).slice(0,600);await speichern()},
 teilen:async on=>{S.d.plan.geteilt=!!on;await speichern();fb.toast(on?"Plan wird mit der Lernbegleitung geteilt.":"Plan ist wieder privat.")}
};

/* =========================================================
   LEHRKRAFT-ANSICHT
   ========================================================= */
const TABS=[["uebersicht","Klassenübersicht"],["module","Lernbausteine"],["plan","Feste Termine & Sprechzeiten"],["team","Klassenteam & Freitagsplanung"],["feedback","Block-Feedback"],["anfragen","Hilfe in der Klasse"]];
function lTabs(){return `<div class="wp-seg wp-ltabs">${TABS.map(t=>`<button class="${S.tab===t[0]?"on":""}" onclick="wp.ltab('${t[0]}')">${t[1]}</button>`).join("")}</div>`}
async function lehrerHtml(){
 if(S.tab!=="team")window.__wpStop();
 await ladeAllgemein();
 let h=`<div class="wp-head"><div><div class="kicker">LERNBEGLEITUNG</div><h1>Wochenplanung der Klasse</h1><p>Ihr stellt Lernbausteine und feste Termine (Einführungen, Lernstandsgespräche) ein – die Schüler:innen planen ihre Woche selbst.</p></div></div>
 <div class="wp-bar2">${wochenKopf()}${lTabs()}</div>`;
 const wd=S.d.wochenDoc;
 const live=S.d.module.filter(m=>m.status==="live"&&m.woche===S.woche).length+S.d.einf.filter(e=>e.status==="live").length;
 const entw=S.d.module.filter(m=>m.status!=="live"&&m.woche===S.woche).length+S.d.einf.filter(e=>e.status!=="live").length+S.d.slots.filter(s=>s.status!=="live").length;
 h+=`<div class="wp-stat">${wd&&wd.status==="live"?'<span class="pill ok">Woche ist für die Klasse sichtbar</span>':'<span class="pill">Woche noch nicht freigegeben</span>'}<span>${live} Einträge live</span>${entw?`<span class="pill warn">${entw} Entwurf</span>`:""}</div>`;
 if(S.tab==="uebersicht")h+=await tabUebersicht();
 else if(S.tab==="module")h+=tabModule();
 else if(S.tab==="plan")h+=await tabPlan();
 else if(S.tab==="team")h+=await tabTeam();
 else if(S.tab==="feedback")h+=await tabFeedback();
 else h+=await tabAnfragen();
 return h;
}
/* ---------- Übersicht ---------- */
async function tabUebersicht(){
 const w=S.woche;
 const [users,stat]=await Promise.all([qdocs("users",W("role","student")).catch(()=>[]),qdocs("wpStatus",W("woche",w)).catch(()=>[])]);
 const st=Object.fromEntries(stat.map(s=>[s.uid,s]));
 const sts=users.filter(u=>u.status==="approved").map(u=>({u,s:st[u.uid]||null})).sort((a,b)=>String(a.u.displayName).localeCompare(String(b.u.displayName),"de"));
 S.d.sts=sts;
 const mitPlan=sts.filter(x=>x.s&&x.s.modGeplant>0).length;
 const avg=sts.length?sts.reduce((s,x)=>s+(x.s?x.s.geplantMin:0),0)/sts.length:0;
 const badge=s=>{if(!s||!s.modGesamt)return !s?'<span class="pill rot">kein Plan</span>':'<span class="pill">keine Lernbausteine</span>';const r=s.modGeplant/s.modGesamt;return r>=.7?'<span class="pill ok">Plan steht</span>':r>0?'<span class="pill warn">Plan angefangen</span>':'<span class="pill rot">kein Plan</span>'};
 let h=`<div class="wp-kpis"><div class="card"><b>${sts.length}</b><small>freigeschaltete Schüler:innen</small></div><div class="card"><b>${mitPlan}</b><small>haben Lernbausteine eingeplant</small></div><div class="card"><b>${std(avg)}</b><small>Ø Lernzeit geplant</small></div><div class="card"><b>${sts.reduce((s,x)=>s+(x.s?x.s.checkouts:0),0)}</b><small>Check-outs erledigt</small></div></div>`;
 h+=`<div class="card"><div class="wp-th"><h3>Wer hat schon geplant?</h3><small>Nur Kennzahlen – der Plan selbst bleibt privat, außer die Person teilt ihn.</small></div>
 <div class="wp-tabelle"><div class="wp-tr wp-tk"><span>Pseudonym</span><span>Lernbausteine eingeplant</span><span>Lernzeit (geplant / erledigt)</span><span>Check-outs</span><span>Status</span><span></span><span></span></div>
 ${sts.map(({u,s})=>{const r=s&&s.modGesamt?Math.round(s.modGeplant/s.modGesamt*100):0;
  return `<div class="wp-tr"><span><b>${esc(fb.zkAnzeige(u))}</b></span><span><div class="wp-mini"><i style="width:${r}%"></i></div><small>${s?s.modGeplant+" / "+s.modGesamt:"–"}</small></span><span>${s?std(s.geplantMin)+" / "+std(s.erledigtMin):"–"}</span><span>${s?s.checkouts:"–"}</span><span>${badge(s)}</span><span>${s&&s.geteilt?`<button class="secondary" onclick="wp.planAnsehen('${u.uid}')">Plan ansehen</button>`:'<small>privat</small>'}</span><span><button class="secondary" onclick="wp.dossier('${u.uid}')">Gespräch</button></span></div>`}).join("")||'<p class="wp-leer">Noch keine Schüler:innen freigeschaltet.</p>'}</div></div>
 <div class="card"><h3>Impuls an die Klasse oder eine Auswahl</h3><p class="wp-hint">Erscheint oben im Wochenplan der gewählten Schüler:innen in dieser Woche.</p><textarea id="wpImpuls" rows="2" maxlength="300" placeholder="z. B. Plant bis Mittwoch mindestens zwei Lernzeiten ein.">${esc(S.d.wochenDoc?.impuls||"")}</textarea>
 <label class="wp-impsel">Empfänger <select id="wpImpZiel"><option value="alle">Alle (${sts.length})</option><option value="keinplan">Nur ohne Plan (${sts.filter(x=>!x.s||!x.s.modGeplant).length})</option><option value="wenig">Ohne oder mit angefangenem Plan (${sts.filter(x=>!x.s||!x.s.modGesamt||x.s.modGeplant/x.s.modGesamt<.7).length})</option></select></label>
 <div class="form-actions"><button class="primary" onclick="wp.impuls()">Impuls senden</button></div></div>
 <div class="card wp-ds"><b>Datenschutz:</b> Lehrkräfte sehen die Zahlen in dieser Übersicht (Anzahl eingeplanter Lernbausteine, Lernzeit, Check-outs). Auszeiten, Notizen, Wochenrückblicke und die Inhalte des Plans sind für euch nicht einsehbar – es sei denn, eine Schüler:in teilt ihren Plan ausdrücklich.</div>`;
 return h;
}
async function planAnsehen(u){
 const p=await gdoc("wpPlan",u+"_"+S.woche);if(!p||!p.geteilt)return fb.toast("Dieser Plan ist nicht geteilt.");
 modalOpen(`<div class="wp-artband" style="${artStyle('lernstand')}">Geteilter Plan</div><div class="kicker">GETEILTER PLAN · ${esc(wochenText(S.woche))}</div><h2>Plan</h2>${p.ziel?`<p><b>Wochenziel:</b> ${esc(p.ziel)}</p>`:""}
 <div class="wp-liste">${(p.eintraege||[]).filter(e=>e.typ!=="auszeit").sort((a,b)=>a.d-b.d||a.h-b.h).map(e=>`<div><span class="wp-fl" style="--fc:${FACH(e.fach).c};--fb:${FACH(e.fach).bg}">${esc(FACH(e.fach).l)}</span><b>${esc(e.titel)}</b><small>${TAGE[e.d]} ${esc(zeitBereich(e.h,e.len||1))}${e.erledigt?" · ✓ erledigt":""}</small></div>`).join("")||'<p class="wp-leer">Noch nichts eingeplant.</p>'}</div>
 <div class="form-actions"><button class="primary" onclick="closeModal()">Schließen</button></div>`);
}
async function impuls(){
 const t=($("wpImpuls")?.value||"").trim().slice(0,300),ziel=$("wpImpZiel")?.value||"alle";
 try{
  if(ziel==="alle"){await fb.setDoc(ref("wpWochen",S.woche),{woche:S.woche,impuls:t,status:"live",updatedAt:fb.serverTimestamp()},{merge:true});fb.toast("Impuls an die Klasse gesendet.");return neu()}
  const sts=S.d.sts||[];
  const wahl=sts.filter(x=>ziel==="keinplan"?(!x.s||!x.s.modGeplant):(!x.s||!x.s.modGesamt||x.s.modGeplant/x.s.modGesamt<.7));
  if(!wahl.length)return fb.toast("Keine Schüler:innen in dieser Auswahl.");
  if(!t)return fb.toast("Bitte einen Text eingeben.");
  const bt=fb.writeBatch(fb.db);
  wahl.forEach(x=>bt.set(ref("wpImpuls",x.u.uid+"_"+S.woche),{uid:x.u.uid,woche:S.woche,text:t,von:fb.profile?.displayName||"Lehrkraft",createdAt:fb.serverTimestamp()}));
  await bt.commit();fb.toast("Impuls an "+wahl.length+" Personen gesendet.");
 }catch(e){console.error(e);fb.toast("Nicht möglich.")}
}
/* ---------- Module ---------- */
function tabModule(){
 const mods=S.d.module;
 const grp={};mods.forEach(m=>(grp[m.typ]=grp[m.typ]||[]).push(m));
 let h=`<div class="wp-actions2"><button class="primary" onclick="wp.modulForm()">＋ Neuer Lernbaustein</button><button class="secondary" onclick="wp.zeitenForm()">Stundenzeiten</button><button class="secondary" onclick="wp.modulExport()" title="Alle Lernbausteine dieser Woche als Datei sichern oder an andere Klassen weitergeben">Bausteine exportieren</button><button class="secondary" onclick="document.getElementById('wpImpFile').click()" title="Lernbausteine aus einer Datei übernehmen">Bausteine importieren</button><input id="wpImpFile" type="file" accept=".json,application/json" hidden onchange="wp.modulImport(this)"></div>${artLegende()}`;
 if(!mods.length)h+=`<div class="card"><p class="wp-leer">Für diese Woche gibt es noch keine Lernbausteine. Legt mit „Neuer Lernbaustein“ alle Arten an und gestaltet sie je Art (z. B. Lernrallye mit Stationen). Einführungen, Projekte, Lernstandsgespräche und Gruppenübungen könnt ihr mit einem festen Termin platzieren; einfache feste Termine setzt ihr auch im Reiter „Feste Termine & Sprechzeiten“.</p></div>`;
 [...ART_REIHE,...Object.keys(grp).filter(k=>!ART_REIHE.includes(k))].filter(k=>grp[k]).forEach(k=>{const a=artOf(k);
  h+=`<div class="card wp-artcard" style="${artStyle(k)}"><h3><span class="wp-art" style="${artStyle(k)}">${esc(MTYP[k]?.l||a.l)}</span> <small>${grp[k].length}</small></h3><div class="wp-liste">${grp[k].map(m=>{const f=FACH(m.fach);return `<div><span class="wp-fl" style="--fc:${f.c};--fb:${f.bg}">${esc(f.l)}</span><b>${esc(m.titel)}</b><small>${esc(dauerInfo(m).label)}${m.pflicht?" · Pflicht":""}${m.woche===""?" · jede Woche":""}${m.fixTag!=null&&m.fixTag!==""?" · fest: "+TAGE[m.fixTag]+", "+(m.fixStd||1)+". Std.":""}${(m.anhaenge||[]).length?" · "+m.anhaenge.length+" Anhang":""}${m.typ==="lernstand"?fuerText(m):""}</small>
  <span class="pill ${m.status==="live"?"ok":"warn"}">${m.status==="live"?"live":"Entwurf"}</span>
  <span class="wp-rowact"><button class="secondary" onclick="wp.vorschau('${m.id}')">Vorschau</button><button class="secondary" onclick="wp.modulForm('${m.id}')">Bearbeiten</button><button class="secondary" onclick="wp.modulKopie('${m.id}')" title="als Entwurf in die nächste Woche kopieren">→ Nächste Woche</button><button class="secondary" onclick="wp.modulWeg('${m.id}')">Löschen</button></span></div>`}).join("")}</div></div>`});
 return h;
}
function wochenOptionen(sel){
 const a=parse(S.woche);return [[S.woche,"Diese Woche ("+wochenText(S.woche).split(" · ")[0]+")"],[iso(addD(a,7)),"Nächste Woche"],["","Jede Woche verfügbar"]].map(o=>`<option value="${o[0]}" ${o[0]===sel?"selected":""}>${o[1]}</option>`).join("")
}
/* Individuelle Zuordnung (Lernstandsgespräch): Auswahl der Schüler:innen */
function fuerHtml(sel){
 return `<div id="fuerBox" class="wp-fuer"><b>Für wen ist das Lernstandsgespräch?</b><small class="wp-hint">Das Gespräch ist individuell: Nur die gewählten Schüler:innen sehen und planen es. Ohne Auswahl gilt es für die ganze Klasse.</small><div id="fuerListe" data-sel="${esc((sel||[]).join(","))}"><small class="wp-leer">Schüler:innen werden geladen …</small></div></div>`;
}
async function fuerLaden(){
 const box=$("fuerListe");if(!box)return;
 const sel=new Set((box.dataset.sel||"").split(",").filter(Boolean));
 try{
  const us=(await qdocs("users",W("role","student"))).filter(u=>u.status==="approved").sort((a,b)=>String(fb.zkAnzeige(a)).localeCompare(String(fb.zkAnzeige(b)),"de"));
  box.innerHTML=us.length?`<div class="wp-fuer-akt"><button type="button" class="text-button" onclick="wp.fuerAlle(true)">alle</button><button type="button" class="text-button" onclick="wp.fuerAlle(false)">keine</button></div><div class="wp-fuer-gitter">${us.map(u=>`<label class="check"><input type="checkbox" class="fuerC" value="${esc(u.uid)}" ${sel.has(u.uid)?"checked":""}><span>${esc(fb.zkAnzeige(u))}</span></label>`).join("")}</div>`:`<small class="wp-leer">Noch keine Schüler:innen freigeschaltet.</small>`;
 }catch(e){box.innerHTML=`<small class="wp-leer">Die Liste konnte nicht geladen werden.</small>`}
}
const fuerAlle=on=>document.querySelectorAll(".fuerC").forEach(c=>{c.checked=!!on});
const fuerLesen=()=>[...document.querySelectorAll(".fuerC:checked")].map(c=>c.value).slice(0,60);
function fuerText(x){const n=Array.isArray(x.fuer)?x.fuer.length:0;return n?` · für ${n} Schüler:in${n===1?"":"nen"}`:""}
function modulForm(id){
 const m=id?S.d.module.find(x=>x.id===id):{titel:"",fach:"deutsch",typ:"selbstlern",len:1,woche:S.woche,beschr:"",route:"",link:"",pflicht:false,mehrfach:false,status:"entwurf"};
 S.anh=[...(m.anhaenge||[])];
 S.rally=(m.rallye||[]).map(rallyEdit);
 modalOpen(`<div id="mfWrap" class="wp-artform" style="${artStyle(m.typ)}"><div id="mfBand" class="wp-artband" style="${artStyle(m.typ)}">${esc(artOf(m.typ).l)}</div><div class="kicker">LERNBAUSTEIN</div><h2>${id?"Lernbaustein bearbeiten":"Neuer Lernbaustein"}</h2><div class="form">
 <label>Titel<input id="mfTitel" maxlength="80" value="${esc(m.titel)}"></label>
 <label>Fach<select id="mfFach">${FAECHER.map(f=>`<option value="${f.k}" ${f.k===m.fach?"selected":""}>${esc(f.l)}</option>`).join("")}</select></label>
 <label>Art<select id="mfTyp" onchange="wp.artVorschau(this.value)">${[...MODUL_ARTEN,...(MODUL_ARTEN.includes(m.typ)?[]:[m.typ])].map(k=>`<option value="${k}" ${k===m.typ?"selected":""}>${esc(MTYP[k]?.l||artOf(k).l)}</option>`).join("")}</select></label>
 <label>Dauer<select id="mfLen">${DAUER_OPT.map(o=>`<option value="${o[0]}" ${o[0]===(dauerInfo(m).code||String(dauerInfo(m).min))?"selected":""}>${o[1]}</option>`).join("")}</select></label>
 <label>Platzierung im Plan<select id="mfFixTag"><option value="">Frei wählbar (Schüler:innen planen selbst)</option>${TAGEL.map((t,i)=>`<option value="${i}" ${String(m.fixTag)===String(i)?"selected":""}>Fester Termin: ${t}</option>`).join("")}</select></label>
 <label>… in der Stunde<select id="mfFixStd">${[...Array(10)].map((_,i)=>`<option value="${i+1}" ${(m.fixStd||1)===i+1?"selected":""}>${i+1}. Stunde (${esc(zeiten()[i]||"")})</option>`).join("")}</select></label>
 <small class="wp-hint">Bei „Fester Termin“ erscheint der Lernbaustein automatisch an diesem Tag und dieser Stunde im Wochenplan aller Schüler:innen (bei Tages-/Wochenbausteinen zählt nur der Tag).</small>
 <label>Gilt für<select id="mfWoche">${wochenOptionen(m.woche)}</select></label>
 <label>Beschreibung<textarea id="mfBeschr" rows="3" maxlength="400">${esc(m.beschr||"")}</textarea></label>
 <div id="mfFuerWrap" ${m.typ==="lernstand"?"":"hidden"}>${fuerHtml(m.fuer)}</div>
 <div id="mfGest" class="wp-gest">${gestFelderHtml(m.typ,m.gestaltung)}</div>
 ${anhForm()}
 <label>Verknüpfte Seite in der App<select id="mfRoute">${ROUTEN.map(r=>`<option value="${r[0]}" ${r[0]===(m.route||"")?"selected":""}>${r[1]}</option>`).join("")}</select></label>
 <label>oder Link (https://…)<input id="mfLink" maxlength="300" value="${esc(m.link||"")}"></label>
 <label class="check"><input type="checkbox" id="mfPflicht" ${m.pflicht?"checked":""}><span>Pflicht-Lernbaustein</span></label>
 <label class="check"><input type="checkbox" id="mfMehr" ${m.mehrfach?"checked":""}><span>Kann mehrfach eingeplant werden</span></label>
 <label>Status<select id="mfStatus"><option value="entwurf" ${m.status!=="live"?"selected":""}>Entwurf (nur Lehrkräfte)</option><option value="live" ${m.status==="live"?"selected":""}>Live (Schüler:innen sehen es)</option></select></label>
 <div class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button><button class="primary" onclick="wp.modulSave('${id||""}')">Speichern</button></div></div></div>`);
 if(m.typ==="lernstand")fuerLaden();
}
async function modulSave(id){
 const titel=$("mfTitel").value.trim();if(titel.length<2)return fb.toast("Bitte einen Titel eingeben.");
 const link=$("mfLink").value.trim();if(link&&!/^https:\/\//.test(link))return fb.toast("Der Link muss mit https:// beginnen.");
 const d={titel,fach:$("mfFach").value,typ:$("mfTyp").value,dauer:dauerInfo({dauer:$("mfLen").value}).code,len:dauerInfo({dauer:$("mfLen").value}).len,anhaenge:S.anh||[],gestaltung:gestLesen($("mfTyp").value),rallye:$("mfTyp").value==="lernrallye"?(S.rally||[]).map(rallyClean):[],fixTag:$("mfFixTag").value===""?null:Number($("mfFixTag").value),fixStd:Number($("mfFixStd").value)||1,woche:$("mfWoche").value,beschr:$("mfBeschr").value.trim(),route:$("mfRoute").value,link,pflicht:$("mfPflicht").checked,mehrfach:$("mfMehr").checked,status:$("mfStatus").value,fuer:$("mfTyp").value==="lernstand"?fuerLesen():[],updatedAt:fb.serverTimestamp()};
 try{if(id)await fb.updateDoc(ref("wpModule",id),d);else await fb.addDoc(col("wpModule"),{...d,createdBy:uid(),createdAt:fb.serverTimestamp()});fb.closeModal();fb.toast("Gespeichert.");neu()}catch(e){console.error(e);fb.toast("Speichern nicht möglich.")}
}
async function modulWeg(id){if(!confirm("Diesen Lernbaustein löschen? Bereits eingeplante Einträge der Schüler:innen bleiben bestehen."))return;try{await fb.deleteDoc(ref("wpModule",id));neu()}catch(e){fb.toast("Nicht möglich.")}}
async function modulKopie(id){
 const m=S.d.module.find(x=>x.id===id);if(!m)return;const {id:_i,...rest}=m;
 try{await fb.addDoc(col("wpModule"),{...rest,woche:iso(addD(parse(S.woche),7)),status:"entwurf",createdBy:uid(),createdAt:fb.serverTimestamp(),updatedAt:fb.serverTimestamp()});fb.toast("Als Entwurf in die nächste Woche kopiert.")}catch(e){console.error(e);fb.toast("Nicht möglich.")}
}
function zeitenForm(){
 modalOpen(`<div class="wp-artband" style="${artStyle('eigen')}">Einstellungen</div><div class="kicker">EINSTELLUNGEN</div><h2>Stundenzeiten</h2><p>Beginn der 10 Stunden (45 Minuten). Gilt für die ganze Klasse.</p><div class="wp-zeitenraster">${zeiten().map((z,i)=>`<label>${i+1}.<input id="zt${i}" type="time" value="${esc(z)}"></label>`).join("")}</div>
 <div class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button><button class="primary" onclick="wp.zeitenSave()">Speichern</button></div>`);
}
async function zeitenSave(){
 const l=[...Array(10)].map((_,i)=>$("zt"+i).value);if(l.some(x=>!/^\d\d:\d\d$/.test(x)))return fb.toast("Bitte alle Zeiten ausfüllen.");
 try{await fb.setDoc(ref("wpEinstellungen","zeiten"),{liste:l,updatedAt:fb.serverTimestamp()});S.zeiten=l;fb.closeModal();neu()}catch(e){fb.toast("Nicht möglich.")}
}
/* ---------- Einführungen & Termine ---------- */
async function tabPlan(){
 const bu=await qdocs("wpBuchungen",W("woche",S.woche)).catch(()=>[]);S.d.buchungen=Object.fromEntries(bu.map(b=>[b.id,b]));
 let h=`<div class="card"><p class="wp-hint">Tippt auf einen freien Platz, um eine <b>Einführung</b>, ein <b>Projekt</b>, ein <b>Lernstandsgespräch</b> oder eine <b>Gruppenübung</b> (feste Termine, die ihr setzt) oder eine <b>Anwesenheit/Sprechzeit</b> anzulegen. Schüler:innen sehen eure Anwesenheit als Kürzel im Plan und buchen dort fachliche Fragen. Entwürfe sind gestrichelt und für Schüler:innen unsichtbar.</p></div>`;
 h+=tageTabs()+rasterHtml({teacher:true});
 const sl=[...S.d.slots].sort((a,b)=>a.d-b.d||a.h-b.h);
 h+=`<div class="card"><h3>Sprechzeiten dieser Woche</h3>${sl.length?`<div class="wp-liste">${sl.map(s=>{const b=S.d.buchungen[s.id];
  return `<div><span></span><b>${TAGE[s.d]} ${esc(zeitBereich(s.h,s.len||1))} · ${esc(s.lehrkraft||"")}</b><small>${esc(FACH(s.fach).l)}</small>${b?`<span class="wp-gebucht"><b>${esc(b.pseudo)}</b>: ${esc(b.frage)}</span>`:`<span class="pill">frei</span>`}<span class="pill ${s.status==="live"?"ok":"warn"}">${s.status==="live"?"live":"Entwurf"}</span><span class="wp-rowact"><button class="secondary" onclick="wp.slotBearbeiten('${s.id}')">Bearbeiten</button></span></div>`}).join("")}</div>`:'<p class="wp-leer">Noch keine Sprechzeiten.</p>'}</div>`;
 return h;
}
function teacherZelle(d,h){
 if(S.tab!=="plan")return;
 if(!frei(d,h,1))return;
 modalOpen(`<div class="kicker">${TAGEL[d]} · ${h}. Stunde</div><h2>Was soll hier stehen?</h2><div class="wp-wahl"><button class="primary" onclick="wp.einfForm(null,${d},${h},'einfuehrung')">Einführung (fester Termin)</button><button class="primary" onclick="wp.einfForm(null,${d},${h},'projekt')">Projekt (fester Termin)</button><button class="primary" onclick="wp.einfForm(null,${d},${h},'lernstand')">Lernstandsgespräch (fester Termin)</button><button class="primary" onclick="wp.einfForm(null,${d},${h},'gruppenuebung')">Gruppenübung (fester Termin)</button><button class="secondary" onclick="wp.slotForm(null,${d},${h})">Anwesenheit / Sprechzeit (buchbar für fachliche Fragen)</button></div><div class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button></div>`);
}
function einfForm(id,d,h,art){
 const e=id?S.d.einf.find(x=>x.id===id):{fach:"deutsch",titel:art==="lernstand"?"Lernstandsgespräch":"",art:artKey(art),d,h,len:1,lehrkraft:fb.profile?.displayName||"",raum:"",status:"entwurf"};
 const T=tart(e);
 S.anh=[...(e.anhaenge||[])];
 modalOpen(`<div class="wp-artform" style="${artStyle(artKey(e.art))}"><div class="wp-artband" style="${artStyle(artKey(e.art))}">${esc(T.l)}</div><div class="kicker">${T.kick}</div><h2>${id?T.edit:T.neu}</h2><div class="form">
 <label>Fach<select id="efFach">${FAECHER.map(f=>`<option value="${f.k}" ${f.k===e.fach?"selected":""}>${esc(f.l)}</option>`).join("")}</select></label>
 <label>${e.art==="lernstand"?"Titel":"Thema / Titel"}<input id="efTitel" maxlength="80" value="${esc(e.titel)}" placeholder="${esc(T.ph)}"></label>
 <label>Tag<select id="efD">${TAGEL.map((t,i)=>`<option value="${i}" ${i===e.d?"selected":""}>${t}</option>`).join("")}</select></label>
 <label>Beginn (Stunde)<select id="efH">${[...Array(10)].map((_,i)=>`<option value="${i+1}" ${i+1===e.h?"selected":""}>${i+1}. Stunde (${esc(zeiten()[i])})</option>`).join("")}</select></label>
 <label>Dauer<select id="efLen"><option value="1" ${e.len!==2?"selected":""}>45 Minuten</option><option value="2" ${e.len===2?"selected":""}>90 Minuten</option></select></label>
 ${e.art==="lernstand"?fuerHtml(e.fuer):""}
 ${anhForm()}
 <label>Lehrkraft<input id="efLk" maxlength="60" value="${esc(e.lehrkraft||"")}"></label><label>Raum (optional)<input id="efRaum" maxlength="20" value="${esc(e.raum||"")}"></label>
 <label>Status<select id="efStatus"><option value="entwurf" ${e.status!=="live"?"selected":""}>Entwurf</option><option value="live" ${e.status==="live"?"selected":""}>Live</option></select></label>
 <div class="form-actions">${id?`<button class="secondary" onclick="wp.einfWeg('${id}')">Löschen</button>`:""}<button class="secondary" onclick="closeModal()">Abbrechen</button><button class="primary" onclick="wp.einfSave('${id||""}','${e.art||"einfuehrung"}')">Speichern</button></div></div></div>`);
 if(e.art==="lernstand")fuerLaden();
}
async function einfSave(id,art){
 const d=Number($("efD").value),h=Number($("efH").value),len=Number($("efLen").value)||1,titel=$("efTitel").value.trim();
 if(titel.length<2)return fb.toast(art==="lernstand"?"Bitte einen Titel eingeben.":"Bitte ein Thema eingeben.");
 if(!frei(d,h,len,id))return fb.toast("Zu dieser Zeit ist schon etwas eingetragen (oder die Stunde reicht über den Tag hinaus).");
 const data={woche:S.woche,d,h,len,art:artKey(art),fach:$("efFach").value,titel,lehrkraft:$("efLk").value.trim(),raum:$("efRaum").value.trim(),anhaenge:S.anh||[],fuer:artKey(art)==="lernstand"?fuerLesen():[],status:$("efStatus").value,updatedAt:fb.serverTimestamp()};
 try{if(id)await fb.updateDoc(ref("wpEinfuehrungen",id),data);else await fb.addDoc(col("wpEinfuehrungen"),{...data,createdBy:uid(),createdAt:fb.serverTimestamp()});fb.closeModal();neu()}catch(e){console.error(e);fb.toast("Speichern nicht möglich.")}
}
async function einfWeg(id){if(!confirm(tart(S.d.einf.find(x=>x.id===id)).weg))return;try{await fb.deleteDoc(ref("wpEinfuehrungen",id));fb.closeModal();neu()}catch(e){fb.toast("Nicht möglich.")}}
function slotForm(id,d,h){
 const s=id?S.d.slots.find(x=>x.id===id):{fach:"deutsch",d,h,len:1,lehrkraft:fb.profile?.displayName||"",status:"entwurf"};
 modalOpen(`<div class="wp-artband" style="${artStyle('frage')}">Sprechzeit</div><div class="kicker">SPRECHZEIT</div><h2>${id?"Sprechzeit bearbeiten":"Neue Sprechzeit"}</h2><p class="wp-hint">Schüler:innen können diesen Termin für eine fachliche Frage buchen (ein Platz).</p><div class="form">
 <label>Lehrkraft<input id="slLk" maxlength="60" value="${esc(s.lehrkraft||"")}"></label>
 <label>Kürzel im Wochenplan (2–4 Buchstaben)<input id="slK" maxlength="4" value="${esc(s.kuerzel||kuerzel(s))}"></label>
 <label>Fach<select id="slFach">${FAECHER.map(f=>`<option value="${f.k}" ${f.k===s.fach?"selected":""}>${esc(f.l)}</option>`).join("")}</select></label>
 <label>Tag<select id="slD">${TAGEL.map((t,i)=>`<option value="${i}" ${i===s.d?"selected":""}>${t}</option>`).join("")}</select></label>
 <label>Beginn (Stunde)<select id="slH">${[...Array(10)].map((_,i)=>`<option value="${i+1}" ${i+1===s.h?"selected":""}>${i+1}. Stunde (${esc(zeiten()[i])})</option>`).join("")}</select></label>
 <label>Dauer<select id="slLen"><option value="1" ${s.len!==2?"selected":""}>45 Minuten</option><option value="2" ${s.len===2?"selected":""}>90 Minuten</option></select></label>
 <label>Status<select id="slStatus"><option value="entwurf" ${s.status!=="live"?"selected":""}>Entwurf</option><option value="live" ${s.status==="live"?"selected":""}>Live</option></select></label>
 <div class="form-actions">${id?`<button class="secondary" onclick="wp.slotWeg('${id}')">Löschen</button>`:""}<button class="secondary" onclick="closeModal()">Abbrechen</button><button class="primary" onclick="wp.slotSave('${id||""}')">Speichern</button></div></div>`);
}
async function slotSave(id){
 const d=Number($("slD").value),h=Number($("slH").value),len=Number($("slLen").value)||1;
 if(!frei(d,h,len,id))return fb.toast("Zu dieser Zeit ist schon etwas eingetragen.");
 const data={woche:S.woche,d,h,len,fach:$("slFach").value,lehrkraft:$("slLk").value.trim(),kuerzel:($("slK").value.trim().toUpperCase().slice(0,4))||kuerzel({lehrkraft:$("slLk").value}),lehrkraftUid:uid(),status:$("slStatus").value,updatedAt:fb.serverTimestamp()};
 try{if(id)await fb.updateDoc(ref("wpSlots",id),data);else await fb.addDoc(col("wpSlots"),{...data,createdAt:fb.serverTimestamp()});fb.closeModal();neu()}catch(e){console.error(e);fb.toast("Speichern nicht möglich.")}
}
async function slotWeg(id){
 if(!confirm("Diese Sprechzeit löschen? Eine bestehende Buchung wird dabei aufgehoben."))return;
 try{const b=fb.writeBatch(fb.db);b.delete(ref("wpSlots",id));if(S.d.buchungen&&S.d.buchungen[id]){b.delete(ref("wpBuchungen",id))}b.delete(ref("wpBelegt",id));await b.commit();fb.closeModal();neu()}
 catch(e){console.error(e);try{await fb.deleteDoc(ref("wpSlots",id));fb.closeModal();neu()}catch(x){fb.toast("Nicht möglich.")}}
}
/* ---------- Klassenteam & gemeinsame Planung ---------- */
async function tabTeam(){
 const w=S.woche,[tpD,anw,schueler]=await Promise.all([gdoc("wpTeamPlan",w),gdoc("wpAnwesenheit",w),fb.schueler().catch(()=>[])]);
 const tp=tpD||{notizen:{},todos:[]};S.d.teamPlan=tp;S.d.anw=anw||{woche:w,eintraege:{},planung:""};S.d.schueler=schueler;
 const kern=FAECHER.slice(0,7);
 const entw=S.d.module.filter(m=>m.status!=="live"&&m.woche===w).length+S.d.einf.filter(e=>e.status!=="live").length+S.d.slots.filter(s=>s.status!=="live").length;
 const fold=(id,titel,inner,offen)=>`<details class="card wp-fold" id="${id}" ${S.fold&&S.fold[id]!==undefined?(S.fold[id]?"open":""):(offen?"open":"")} ontoggle="wp.foldMerk('${id}',this.open)"><summary><b>${titel}</b></summary>${inner}</details>`;
 let h=fold("fdFreitag","Freitagsplanung · Anwesenheit der Woche",freitagInner(),true);
 h+=fold("fdChat","Klassenteam · Austausch",`<div id="wpChat" class="wp-chat"><p class="wp-leer">Wird geladen …</p></div>
 <div class="wp-chatform"><input id="wpChatText" maxlength="500" placeholder="Nachricht ans Team …" onkeydown="if(event.key==='Enter')wp.chatSenden()"><button class="primary" onclick="wp.chatSenden()">Senden</button></div><small class="wp-hint">Nur für Lehrkräfte sichtbar. Bitte keine Schülernamen oder sensiblen Daten.</small>`,false);
 h+=fold("fdPlan",esc(wochenText(w))+" gemeinsam planen",`<p class="wp-hint">Was steht in dieser Woche je Fach an? Eure Notizen sind nur für das Team sichtbar.</p>
 ${kern.map(f=>`<label class="wp-notiz" style="--fc:${f.c}"><span>${esc(f.l)}</span><textarea rows="2" maxlength="400" onchange="wp.teamNotiz('${f.k}',this.value)" placeholder="Einführung, Lernstandsgespräche, Check-out, Besonderheiten …">${esc(tp.notizen?.[f.k]||"")}</textarea></label>`).join("")}
 <h4>To-dos fürs Team</h4><div id="wpTodos">${(tp.todos||[]).map(t=>`<label class="check"><input type="checkbox" ${t.done?"checked":""} onchange="wp.todoToggle('${t.id}')"><span>${esc(t.t)}</span> <button class="text-button" onclick="wp.todoWeg('${t.id}')">×</button></label>`).join("")||'<small class="wp-leer">Noch keine To-dos.</small>'}</div>
 <div class="wp-chatform"><input id="wpTodoText" maxlength="120" placeholder="Neues To-do …" onkeydown="if(event.key==='Enter')wp.todoNeu()"><button class="secondary" onclick="wp.todoNeu()">Hinzufügen</button></div>
 <div class="wp-freigabe"><div><b>${entw} Entwurf${entw===1?"":"e"}</b> für diese Woche · ${wochenDocStatus()}</div><div class="form-actions"><button class="secondary" onclick="wp.vorwoche()">Feste Termine der Vorwoche übernehmen</button><button class="primary" onclick="wp.freigeben()">Woche für die Klasse freigeben</button></div></div>`,true);
 setTimeout(chatStart,0);
 return h;
}
/* ---------- Freitagsplanung: Anwesenheit unter der Woche eintragen ---------- */
const ANW_ZUSTAND={"":{t:"–",l:"offen"},a:{t:"A",l:"anwesend"},f:{t:"F",l:"fehlt"},e:{t:"E",l:"entschuldigt"}};
const ANW_NEXT={"":"a",a:"f",f:"e",e:""};
function anwZelle(u,d){const z=(S.d.anw.eintraege?.[u]||{})[d]||"";return `<button type="button" class="wp-anw z-${z||"o"}" title="${ANW_ZUSTAND[z].l}" onclick="wp.anwKlick('${u}',${d},this)">${ANW_ZUSTAND[z].t}</button>`}
function freitagInner(){
 const w=parse(S.woche),l=S.d.schueler||[];
 if(!l.length)return `<p class="wp-leer">Keine freigeschalteten Schüler:innen gefunden.</p>`;
 const fehl=u=>Object.values(S.d.anw.eintraege?.[u]||{}).filter(v=>v==="f"||v==="e").length;
 return `<p class="wp-hint">Tippe auf ein Feld, um zu wechseln: – offen → A anwesend → F fehlt → E entschuldigt. Die Anwesenheit ist nur für Lehrkräfte sichtbar und kann jeden Tag der Woche eingetragen werden.</p>
 <div class="wp-anwtab"><table><thead><tr><th>Schüler:in</th>${TAGE.map((t,d)=>`<th>${t}<small>${dm(addD(w,d))}</small><button type="button" class="text-button" onclick="wp.anwAlle(${d})" title="Alle offenen Felder dieses Tages auf anwesend setzen">alle A</button></th>`).join("")}<th>Fehltage</th></tr></thead>
 <tbody>${l.map(u=>`<tr><td>${esc(u.displayName||u.email||"")}</td>${TAGE.map((t,d)=>`<td id="anw_${u.uid}_${d}">${anwZelle(u.uid,d)}</td>`).join("")}<td id="anwsum_${u.uid}"><b>${fehl(u.uid)}</b></td></tr>`).join("")}</tbody></table></div>
 <label class="wp-notiz" style="--fc:#8f9bb3"><span>Planung für Freitag</span><textarea rows="3" maxlength="600" onchange="wp.anwPlanung(this.value)" placeholder="Was wird am Freitag besprochen oder vorbereitet? Rückmeldungen, Gespräche, Vorhaben der nächsten Woche …">${esc(S.d.anw.planung||"")}</textarea></label>`;
}
async function anwSchreiben(felder){
 const r=ref("wpAnwesenheit",S.woche);
 try{await fb.updateDoc(r,{...felder,updatedBy:uid(),updatedAt:fb.serverTimestamp()})}
 catch(e){
  if(e&&e.code==="not-found"){await fb.setDoc(r,{woche:S.woche,eintraege:{},planung:"",updatedBy:uid(),updatedAt:fb.serverTimestamp()});await fb.updateDoc(r,{...felder,updatedBy:uid(),updatedAt:fb.serverTimestamp()})}
  else throw e}
}
async function anwKlick(u,d,btn){
 const e=S.d.anw.eintraege=S.d.anw.eintraege||{};e[u]=e[u]||{};
 const alt=e[u][d]||"",neu_=ANW_NEXT[alt];
 e[u][d]=neu_;
 try{await anwSchreiben({["eintraege."+u+"."+d]:neu_});const c=$("anw_"+u+"_"+d);if(c)c.innerHTML=anwZelle(u,d);const sm=$("anwsum_"+u);if(sm)sm.innerHTML="<b>"+Object.values(e[u]).filter(v=>v==="f"||v==="e").length+"</b>"}
 catch(err){e[u][d]=alt;console.error(err);fb.toast("Anwesenheit konnte nicht gespeichert werden (firestore.rules veröffentlicht?).")}
}
async function anwAlle(d){
 const e=S.d.anw.eintraege=S.d.anw.eintraege||{},f={};
 (S.d.schueler||[]).forEach(u=>{e[u.uid]=e[u.uid]||{};if(!e[u.uid][d]){e[u.uid][d]="a";f["eintraege."+u.uid+"."+d]="a"}});
 if(!Object.keys(f).length)return;
 try{await anwSchreiben(f);neu()}catch(err){console.error(err);fb.toast("Anwesenheit konnte nicht gespeichert werden.")}
}
async function anwPlanung(t){S.d.anw.planung=String(t).slice(0,600);try{await anwSchreiben({planung:S.d.anw.planung})}catch(e){fb.toast("Nicht möglich.")}}
const wochenDocStatus=()=>S.d.wochenDoc&&S.d.wochenDoc.status==="live"?"für die Klasse sichtbar":"noch nicht freigegeben";
function chatStart(){
 window.__wpStop();const box=$("wpChat");if(!box)return;
 S.chatUnsub=fb.onSnapshot(fb.query(col("wpTeamChat"),fb.orderBy("createdAt","desc"),fb.limit(60)),snap=>{
  const el=$("wpChat");if(!el)return;const me=uid();
  const l=snap.docs.map(d=>({id:d.id,...d.data()})).reverse();
  el.innerHTML=l.length?l.map(m=>`<div class="wp-msg${m.fromUid===me?" mine":""}"><small>${esc(m.fromName||"Lehrkraft")} · ${m.createdAt?.toDate?esc(m.createdAt.toDate().toLocaleString("de-DE",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})):""}</small><div>${esc(m.text)}</div></div>`).join(""):'<p class="wp-leer">Noch keine Nachrichten.</p>';
  el.scrollTop=el.scrollHeight;
 },e=>{console.warn("Chat:",e);const el=$("wpChat");if(el)el.innerHTML='<p class="wp-leer">Chat nicht verfügbar.</p>'});
}
async function chatSenden(){
 const i=$("wpChatText"),t=(i?.value||"").trim();if(!t)return;
 try{await fb.addDoc(col("wpTeamChat"),{text:t.slice(0,500),fromUid:uid(),fromName:fb.profile?.displayName||"Lehrkraft",createdAt:fb.serverTimestamp()});i.value=""}catch(e){console.error(e);fb.toast("Senden nicht möglich.")}
}
async function teamSpeichern(){await fb.setDoc(ref("wpTeamPlan",S.woche),{woche:S.woche,notizen:S.d.teamPlan.notizen||{},todos:S.d.teamPlan.todos||[],updatedBy:uid(),updatedAt:fb.serverTimestamp()})}
async function teamNotiz(k,t){S.d.teamPlan.notizen=S.d.teamPlan.notizen||{};S.d.teamPlan.notizen[k]=String(t).slice(0,400);try{await teamSpeichern()}catch(e){fb.toast("Speichern nicht möglich.")}}
async function todoNeu(){const i=$("wpTodoText"),t=(i?.value||"").trim();if(!t)return;S.d.teamPlan.todos=[...(S.d.teamPlan.todos||[]),{id:nid(),t:t.slice(0,120),done:false}];try{await teamSpeichern();neu()}catch(e){fb.toast("Nicht möglich.")}}
async function todoToggle(id){const t=(S.d.teamPlan.todos||[]).find(x=>x.id===id);if(t){t.done=!t.done;try{await teamSpeichern()}catch(e){fb.toast("Nicht möglich.")}}}
async function todoWeg(id){S.d.teamPlan.todos=(S.d.teamPlan.todos||[]).filter(x=>x.id!==id);try{await teamSpeichern();neu()}catch(e){fb.toast("Nicht möglich.")}}
async function freigeben(){
 const entw=[...S.d.module.filter(m=>m.status!=="live"&&m.woche===S.woche).map(m=>["wpModule",m.id]),...S.d.einf.filter(e=>e.status!=="live").map(e=>["wpEinfuehrungen",e.id]),...S.d.slots.filter(s=>s.status!=="live").map(s=>["wpSlots",s.id])];
 if(!confirm("Alle "+entw.length+" Entwürfe dieser Woche für die Klasse freigeben?"))return;
 try{
  for(let i=0;i<entw.length;i+=400){const b=fb.writeBatch(fb.db);entw.slice(i,i+400).forEach(([c,id])=>b.update(ref(c,id),{status:"live",updatedAt:fb.serverTimestamp()}));await b.commit()}
  await fb.setDoc(ref("wpWochen",S.woche),{woche:S.woche,status:"live",updatedAt:fb.serverTimestamp()},{merge:true});
  fb.toast("Woche freigegeben.");neu();
 }catch(e){console.error(e);fb.toast("Freigabe nicht möglich.")}
}
async function vorwoche(){
 const prev=iso(addD(parse(S.woche),-7));
 try{
  const l=await qdocs("wpEinfuehrungen",W("woche",prev));if(!l.length)return fb.toast("In der Vorwoche gibt es keine festen Termine.");
  let n=0;for(const e of l){const {id,...r}=e;if(!frei(r.d,r.h,r.len||1))continue;await fb.addDoc(col("wpEinfuehrungen"),{...r,woche:S.woche,status:"entwurf",createdBy:uid(),createdAt:fb.serverTimestamp(),updatedAt:fb.serverTimestamp()});n++}
  fb.toast(n+" Termin(e) als Entwurf übernommen.");neu();
 }catch(e){console.error(e);fb.toast("Nicht möglich.")}
}
/* ---------- Hilfe in der Klasse ---------- */
async function tabAnfragen(){
 const [an,tu]=await Promise.all([qdocs("wpAnfragen",W("woche",S.woche)).catch(()=>[]),qdocs("wpTutor").catch(()=>[])]);
 const n=s=>an.filter(a=>a.status===s).length;
 let h=`<div class="wp-kpis"><div class="card"><b>${tu.filter(t=>t.art==="tutor").length}</b><small>Tutor:innen-Angebote</small></div><div class="card"><b>${tu.filter(t=>t.art==="kompetenz").length}</b><small>Kompetenz-Angebote</small></div><div class="card"><b>${n("angenommen")}</b><small>bestätigte Termine (Woche)</small></div><div class="card"><b>${n("offen")}</b><small>offene Anfragen (Woche)</small></div></div>`;
 h+=`<div class="card"><h3>Angebote der Klasse</h3><div class="wp-liste">${tu.map(t=>`<div><span>${t.art==="kompetenz"?"":""}</span><b>${esc(t.pseudo)}</b><small>${esc(t.bereich)}${t.art==="tutor"?" · "+esc(FACH(t.fach).l):""}</small><span class="wp-rowact"><button class="secondary" onclick="wp.angebotMod('${t.id}')">Entfernen</button></span></div>`).join("")||'<p class="wp-leer">Noch keine Angebote.</p>'}</div></div>`;
 h+=`<div class="card"><h3>Anfragen dieser Woche</h3><div class="wp-liste">${an.map(a=>`<div><span>${a.art==="kompetenz"?"":""}</span><b>${esc(a.vonPseudo)} → ${esc(a.tutorPseudo)}</b><small>${TAGE[a.d]} ${esc(zeitBereich(a.h,a.len||1))} · ${esc(a.thema)}${a.projekt?" · "+esc(a.projekt):""}</small><span class="pill ${a.status==="angenommen"?"ok":a.status==="offen"?"warn":""}">${esc(a.status)}</span></div>`).join("")||'<p class="wp-leer">Keine Anfragen in dieser Woche.</p>'}</div></div>`;
 return h;
}
async function angebotMod(id){if(!confirm("Dieses Angebot entfernen?"))return;try{await fb.deleteDoc(ref("wpTutor",id));neu()}catch(e){fb.toast("Nicht möglich.")}}

/* =========================================================
   NEU (Okt 2026): Deeper-Learning-Einheit, Block-Feedback, Offen aus der Vorwoche,
   Lernplan bis Schulaufgabe/Kurzarbeit, Lernstandsgespräch ansetzen mit Vorbereitung,
   gezielter Impuls.
   Neue Sammlungen: wpFeedback, wpFbGegeben, wpLernplan, wpImpuls, wpGespraeche, wpZiele, wpGespraechNotizen
   ========================================================= */
const fmtZ=v=>v==null?"–":(Math.round(v*10)/10).toString().replace(".",",");
const TAGK=["So","Mo","Di","Mi","Do","Fr","Sa"];
const dkurz=s=>s?String(s).slice(8,10)+"."+String(s).slice(5,7)+".":"";

/* ---------- Deeper-Learning-Einheit: Vorlage Fachaufsatz ---------- */
function dlVorlage(){
 const set=(id,v)=>{const e=$(id);if(e)e.value=v};
 set("mfTitel","Fachaufsatz: Aufbau und Bausteine");
 set("mfFach","paedagogik");
 set("mfLen","90");
 set("mfBeschr","Du lernst, aus welchen Bausteinen ein Fachaufsatz besteht, prüfst Aufsätze mit einer Kriterienliste und schreibst in der Gruppe einen eigenen Fachaufsatz.");
 set("gf_ziel","Ich kann den Aufbau eines Fachaufsatzes erklären (Einleitung, Hauptteil, Schluss) und einen eigenen Fachaufsatz mit Zeilenangaben schreiben.");
 set("gf_ablauf",["Einstieg: Das Tafelbild mit den acht Bausteinen kennenlernen (20 Min.)","Aufsatz ordnen, Fehler finden und gemeinsame Kriterien festlegen (25 Min.)","In der Gruppe einen Fachaufsatz zu einem neuen Fallbeispiel schreiben (30 Min.)","Aufsätze vorstellen, Rückmeldung mit Stern und Wunsch, Check-out (15 Min.)"].join("\n"));
 set("gf_material","Tafelbild als Webseite (Link) und Digitale Tafel „Fachaufsatz: Bausteine“ aus dem Vorlagen-Menü der Digitalen Tafel.");
 set("gf_checkout","Erläutern Sie, aus welchen Bausteinen ein Fachaufsatz besteht, und begründen Sie, warum der Einleitungssatz keinen Fallbezug enthält.");
 set("gf_muster","Ein Fachaufsatz besteht aus Einleitung, Hauptteil und Schluss. Die Einleitung beginnt mit einem ganz allgemeinen Einleitungssatz, grenzt den Lernbereich durch die Definitionen von Pädagogik und Psychologie ein und leitet mit Fallbezug und Zeilenangabe zum Hauptteil über. Im Hauptteil wird jeder Theoriepunkt genannt, erklärt und am Fallbeispiel mit Zeilenangabe verdeutlicht (Transfer). Der Schluss enthält einen passenden Gedanken oder Ausblick. Der Einleitungssatz hat keinen Fallbezug, weil er zuerst allgemein ins Thema führt. Der Fallbezug folgt erst in der Überleitung.");
 try{set("mfLink",new URL("deeper-learning/fachaufsatz-tafelbild.html",location.href).href)}catch(e){}
 fb.toast("Vorlage eingefügt. Bitte prüfen und speichern.");
}

/* ---------- Block-Feedback ---------- */
const FB_SKALA=["stimme gar nicht zu","stimme eher nicht zu","teils/teils","stimme eher zu","stimme voll zu"];
const FB_KAT=[
 {k:"lernen",l:"Lernen und Verstehen",f:[["q1","Ich habe in diesem Block viel dazugelernt."],["q2","Die Lernziele waren mir klar."],["q3","Die Aufgaben und Materialien waren verständlich."],["q4","Der Schwierigkeitsgrad war für mich angemessen."]]},
 {k:"steuerung",l:"Selbststeuerung",f:[["q5","Ich konnte meine Woche gut selbst planen."],["q6","Ich wusste, wo und wann ich Hilfe bekomme."],["q7","Die Einführungen der Lehrkräfte haben mir geholfen."]]},
 {k:"zusammen",l:"Zusammenarbeit",f:[["q8","Die Arbeit in der Gruppe hat gut funktioniert."],["q9","Ich konnte meine Ideen einbringen."],["q10","Ich konnte anderen helfen oder Hilfe annehmen."]]},
 {k:"material",l:"Material und Technik",f:[["q11","Das Material (Webseiten, Kurse, Digitale Tafel) war hilfreich."],["q12","Die App und die Digitale Tafel waren einfach zu bedienen."]]},
 {k:"gesamt",l:"Gesamteindruck",f:[["q13","Insgesamt war ich mit diesem Block zufrieden."],["q14","Ich würde diese Art zu lernen weiterempfehlen."],["q15","Die Rückmeldungen der Lehrkräfte haben mir weitergeholfen."]]}
];
const FB_FARBEN=["#4f86e0","#5aa85a","#d9922e","#8a68c9","#17384f"];
const FB_VERT=["#f3c7c1","#f7dfc0","#efe9c4","#d3e7c0","#b6dba0"];
const FB_MIN=3; /* erst ab so vielen Rückmeldungen werden Ergebnisse angezeigt (Anonymität) */
function fbItems(m){
 const ex=m&&m.gestaltung&&m.gestaltung.extra;
 const extra=(Array.isArray(ex)?ex:zeilen(ex)).slice(0,10).map((t,i)=>({id:"x"+(i+1),t,kat:"extra"}));
 return [...FB_KAT.flatMap(k=>k.f.map(([id,t])=>({id,t,kat:k.k}))),...extra];
}
function fbKnopf(e,m){
 if(!e||e.mTyp!=="feedback"||!e.moduleId)return "";
 if(S.d.fbGegeben&&S.d.fbGegeben.has(e.moduleId))return `<p class="wp-hint">Danke, deine Rückmeldung ist angekommen.</p>`;
 return `<div class="form-actions"><button class="primary" onclick="closeModal();wp.fbForm('${e.moduleId}','${e.id}')">Feedback geben</button></div>`;
}
function fbForm(mid,eid){
 const m=S.d.module.find(x=>x.id===mid),e=S.d.plan.eintraege.find(x=>x.id===eid);
 const titel=(m&&m.titel)||(e&&e.titel)||"Block-Feedback",fach=(m&&m.fach)||(e&&e.fach)||"fachuebergreifend",block=(m&&m.gestaltung&&m.gestaltung.block)||"";
 const zeile=(id,t)=>`<fieldset class="wp-fb-z"><legend>${esc(t)}</legend><div class="wp-fb-r">${[1,2,3,4,5].map(v=>`<label title="${esc(FB_SKALA[v-1])}"><input type="radio" name="fb_${id}" value="${v}"><span>${v}</span><em>${esc(FB_SKALA[v-1])}</em></label>`).join("")}</div></fieldset>`;
 const items=fbItems(m);
 const kats=[...FB_KAT.map(k=>({l:k.l,f:items.filter(i=>i.kat===k.k)})),{l:"Weitere Aussagen",f:items.filter(i=>i.kat==="extra")}].filter(k=>k.f.length);
 modalOpen(`<div class="wp-artband" style="${artStyle("feedback")}">Block-Feedback</div><div class="kicker">${esc(FACH(fach).l)}${block?" · "+esc(block):""}</div><h2>${esc(titel)}</h2>
 <p class="wp-hint">Deine Rückmeldung ist anonym. Ergebnisse sehen die Lehrkräfte erst, wenn mindestens ${FB_MIN} Personen geantwortet haben. Skala: 1 = stimme gar nicht zu, 5 = stimme voll zu.</p>
 <div class="wp-fb">${kats.map(k=>`<h4>${esc(k.l)}</h4>${k.f.map(i=>zeile(i.id,i.t)).join("")}`).join("")}
 <h4>In deinen Worten</h4>
 <label class="form"><span>Das fand ich gut:</span><textarea id="fbGut" rows="3" maxlength="600"></textarea></label>
 <label class="form"><span>Das sollte man verbessern:</span><textarea id="fbBesser" rows="3" maxlength="600"></textarea></label>
 <label class="form"><span>Das wünsche ich mir für den nächsten Block (optional):</span><textarea id="fbWunsch" rows="2" maxlength="600"></textarea></label></div>
 <div class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button><button class="primary" onclick="wp.fbSenden('${esc(mid)}','${esc(eid||"")}')">Absenden</button></div>`);
}
async function fbSenden(mid,eid){
 const m=S.d.module.find(x=>x.id===mid),e=S.d.plan.eintraege.find(x=>x.id===eid);
 const items=fbItems(m),ant={};
 items.forEach(i=>{const c=document.querySelector(`input[name="fb_${i.id}"]:checked`);if(c)ant[i.id]=Number(c.value)});
 if(Object.keys(ant).length<5)return fb.toast("Bitte beantworte mindestens 5 Aussagen.");
 const txt=id=>($(id)?.value||"").trim().slice(0,600),me=uid();
 const titel=(m&&m.titel)||(e&&e.titel)||"Block-Feedback",fach=(m&&m.fach)||(e&&e.fach)||"fachuebergreifend",block=(m&&m.gestaltung&&m.gestaltung.block)||"";
 try{
  const b=fb.writeBatch(fb.db);
  b.set(fb.doc(col("wpFeedback")),{moduleId:mid,fach,block,titel,blockDatum:(m&&m.woche)||"",datum:iso(new Date()),antworten:ant,gut:txt("fbGut"),besser:txt("fbBesser"),wunsch:txt("fbWunsch"),createdAt:fb.serverTimestamp()});
  b.set(ref("wpFbGegeben",mid+"_"+me),{uid:me,moduleId:mid,createdAt:fb.serverTimestamp()});
  await b.commit();
  S.d.fbGegeben.add(mid);
  if(e&&!e.erledigt){e.erledigt=true;e.doneAt=Date.now();await speichern()}
  fb.closeModal();fb.toast("Danke für dein Feedback.");neu();
 }catch(err){console.error(err);fb.toast("Senden nicht möglich. Hast du schon Feedback gegeben?")}
}
/* Auswertung (Lehrkräfte) */
function fbStat(b){
 if(b._st)return b._st;
 const gueltig=v=>typeof v==="number"&&v>=1&&v<=5;
 const st={};b.items.forEach(i=>{const v=b.rs.map(r=>r.antworten&&r.antworten[i.id]).filter(gueltig),d=[0,0,0,0,0];v.forEach(x=>d[x-1]++);st[i.id]={n:v.length,mean:v.length?v.reduce((a,c)=>a+c,0)/v.length:null,d}});
 const kat={};FB_KAT.forEach(k=>{const vals=k.f.flatMap(([id])=>b.rs.map(r=>r.antworten&&r.antworten[id]).filter(gueltig));kat[k.k]=vals.length?vals.reduce((a,c)=>a+c,0)/vals.length:null});
 return (b._st={st,kat});
}
const fbKurz=b=>{const t=(b.m.gestaltung&&b.m.gestaltung.block)||b.m.titel||"Block";return t.length>13?t.slice(0,12)+"…":t};
function fbChart(list){
 if(!list.length)return "";
 const Wd=640,H=270,L=40,R=16,T=14,B=46,pw=Wd-L-R,ph=H-T-B;
 const x=i=>L+(list.length===1?pw/2:i*pw/(list.length-1)),y=v=>T+(5-v)/4*ph;
 let s=`<svg viewBox="0 0 ${Wd} ${H}" role="img" aria-label="Verlauf der Mittelwerte je Kategorie über die Blöcke" class="wp-chart">`;
 for(let v=1;v<=5;v++)s+=`<line x1="${L}" x2="${Wd-R}" y1="${y(v)}" y2="${y(v)}" stroke="#dce7ef" stroke-width="1"/><text x="${L-8}" y="${y(v)+4}" text-anchor="end" font-size="11" fill="#6c8190">${v}</text>`;
 list.forEach((b,i)=>{s+=`<text x="${x(i)}" y="${H-26}" text-anchor="middle" font-size="11" fill="#17384f">${esc(fbKurz(b))}</text><text x="${x(i)}" y="${H-11}" text-anchor="middle" font-size="10" fill="#6c8190">${esc(dkurz(b.datum))}</text>`});
 FB_KAT.forEach((k,ki)=>{
  const pts=list.map((b,i)=>({i,v:fbStat(b).kat[k.k]})).filter(p=>p.v!=null);
  if(pts.length>1)s+=`<polyline fill="none" stroke="${FB_FARBEN[ki]}" stroke-width="2.5"${k.k==="gesamt"?' stroke-dasharray="6 4"':""} points="${pts.map(p=>x(p.i)+","+y(p.v)).join(" ")}"/>`;
  pts.forEach(p=>{s+=`<circle cx="${x(p.i)}" cy="${y(p.v)}" r="4" fill="${FB_FARBEN[ki]}"><title>${esc(k.l)}: ${fmtZ(p.v)}</title></circle>`});
 });
 return s+"</svg>";
}
async function tabFeedback(){
 const [mods,resp,users]=await Promise.all([qdocs("wpModule",W("typ","feedback")).catch(()=>[]),qdocs("wpFeedback").catch(()=>[]),qdocs("users",W("role","student")).catch(()=>[])]);
 const nS=users.filter(u=>u.status==="approved").length;
 const byM={};resp.forEach(r=>(byM[r.moduleId]=byM[r.moduleId]||[]).push(r));
 const alle=mods.map(m=>{const rs=byM[m.id]||[];return {m,rs,n:rs.length,items:fbItems(m),datum:m.woche||rs.map(r=>r.datum).filter(Boolean).sort()[0]||""}}).sort((a,b)=>String(a.datum).localeCompare(String(b.datum)));
 const faecher=[...new Set(alle.map(b=>b.m.fach))];
 const fil=S.fbFach&&S.fbFach!=="alle"&&faecher.includes(S.fbFach)?S.fbFach:"alle";
 const bl=alle.filter(b=>fil==="alle"||b.m.fach===fil);
 const sichtbar=bl.filter(b=>b.n>=FB_MIN);
 let h=`<div class="wp-actions2"><button class="primary" onclick="wp.modulForm()">＋ Neues Block-Feedback anlegen</button>${bl.length?`<button class="secondary" onclick="wp.fbCsv()">Ergebnisse als CSV</button>`:""}${faecher.length>1?`<label class="wp-fbfil">Fach <select onchange="wp.fbFach(this.value)"><option value="alle">Alle Fächer</option>${faecher.map(k=>`<option value="${k}" ${k===fil?"selected":""}>${esc(FACH(k).l)}</option>`).join("")}</select></label>`:""}</div>`;
 h+=`<div class="card"><p class="wp-hint">Block-Feedback legt ihr wie einen Lernbaustein an (Art „Block-Feedback“, Reiter „Lernbausteine“). Die Schüler:innen bewerten Aussagen von „stimme gar nicht zu“ bis „stimme voll zu“ und schreiben, was gut war und was besser werden sollte. Die Rückmeldungen sind anonym; Ergebnisse erscheinen ab ${FB_MIN} Rückmeldungen.</p></div>`;
 if(!bl.length)return h+`<div class="card"><p class="wp-leer">Noch kein Block-Feedback angelegt.</p></div>`;
 h+=`<div class="card"><div class="wp-th"><h3>Verlauf im Schuljahr</h3><small>Mittelwerte je Kategorie (1 = stimme gar nicht zu, 5 = stimme voll zu), nur Blöcke ab ${FB_MIN} Rückmeldungen</small></div>`;
 if(!sichtbar.length)h+=`<p class="wp-leer">Der Verlauf erscheint, sobald ein Block mindestens ${FB_MIN} Rückmeldungen hat.</p>`;
 else{
  h+=`<div class="wp-chartbox">${fbChart(sichtbar)}</div><div class="wp-leg2">${FB_KAT.map((k,i)=>`<span><i style="background:${FB_FARBEN[i]}"></i>${esc(k.l)}</span>`).join("")}</div>
  <div class="wp-tabelle"><div class="wp-ftab wp-tk"><span>Block</span>${FB_KAT.map(k=>`<span>${esc(k.l)}</span>`).join("")}<span>Antworten</span></div>${sichtbar.map(b=>{const k=fbStat(b).kat;return `<div class="wp-ftab"><span><b>${esc((b.m.gestaltung&&b.m.gestaltung.block)||b.m.titel)}</b><small>${esc(FACH(b.m.fach).l)} · ${esc(dkurz(b.datum))}</small></span>${FB_KAT.map(c=>`<span>${fmtZ(k[c.k])}</span>`).join("")}<span>${b.n} / ${nS}</span></div>`}).join("")}</div>`;
 }
 h+=`</div>`;
 const leg=`<div class="wp-leg2">${FB_SKALA.map((s,i)=>`<span><i style="background:${FB_VERT[i]}"></i>${esc(s)}</span>`).join("")}</div>`;
 [...bl].reverse().forEach(b=>{
  const f=FACH(b.m.fach),titel=b.m.titel,block=(b.m.gestaltung&&b.m.gestaltung.block)||"";
  h+=`<div class="card wp-fbcard"><div class="wp-th"><h3><span class="wp-fl" style="--fc:${f.c};--fb:${f.bg}">${esc(f.l)}</span> ${esc(titel)}${block?` <small>${esc(block)}</small>`:""}</h3><small>${b.n} von ${nS} Rückmeldungen${b.datum?" · "+esc(dkurz(b.datum)):""}${b.m.status!=="live"?" · Entwurf":""}</small></div>`;
  if(b.n<FB_MIN){h+=`<p class="wp-leer">${b.n?"Noch zu wenige Rückmeldungen ("+b.n+"). ":"Noch keine Rückmeldungen. "}Ergebnisse werden ab ${FB_MIN} Personen angezeigt, damit niemand erkannt werden kann.</p></div>`;return}
  const S2=fbStat(b);
  h+=leg;
  const kats=[...FB_KAT.map(k=>({k:k.k,l:k.l})),{k:"extra",l:"Weitere Aussagen"}];
  kats.forEach(k=>{const it=b.items.filter(i=>i.kat===k.k);if(!it.length)return;
   h+=`<h4>${esc(k.l)}${S2.kat[k.k]!=null?` <small>Ø ${fmtZ(S2.kat[k.k])}</small>`:""}</h4>`;
   it.forEach(i=>{const st=S2.st[i.id];h+=`<div class="wp-fb-row"><span>${esc(i.t)}</span><div class="wp-fb-bar" role="img" aria-label="Verteilung der Antworten">${st.n?st.d.map((c,ix)=>c?`<i style="width:${c/st.n*100}%;background:${FB_VERT[ix]}" title="${esc(FB_SKALA[ix])}: ${c}"></i>`:"").join(""):""}</div><b>${fmtZ(st.mean)}</b></div>`});
  });
  const liste=(feld,l)=>{const v=b.rs.map(r=>r[feld]).filter(x=>x&&String(x).trim());return v.length?`<div class="wp-fb-offen"><h4>${esc(l)}</h4><ul>${v.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>`:""};
  h+=`<div class="wp-fb-offenwrap">${liste("gut","Das fanden sie gut")}${liste("besser","Das sollte man verbessern")}${liste("wunsch","Wünsche für den nächsten Block")}</div></div>`;
 });
 S.fbListe=bl;
 return h;
}
function fbCsv(){
 const bl=S.fbListe||[];const z=v=>String(v==null?"":v).replace(/"/g,'""');
 const rows=[["Block","Fach","Datum","Rückmeldungen","Kategorie","Aussage","Mittelwert","1","2","3","4","5"]];
 bl.forEach(b=>{const t=(b.m.gestaltung&&b.m.gestaltung.block)||b.m.titel,S2=fbStat(b);
  b.items.forEach(i=>{const st=S2.st[i.id];const k=FB_KAT.find(c=>c.k===i.kat);rows.push([t,FACH(b.m.fach).l,b.datum,b.n,k?k.l:"Weitere Aussagen",i.t,b.n>=FB_MIN?fmtZ(st.mean):"",...(b.n>=FB_MIN?st.d:["","","","",""])])})});
 const csv="﻿"+rows.map(r=>r.map(c=>'"'+z(c)+'"').join(";")).join("\r\n");
 const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));a.download="block-feedback.csv";document.body.appendChild(a);a.click();a.remove();
}

/* ---------- Offen aus der Vorwoche (Schüler:innen) ---------- */
const OFFEN_AUS=["einfuehrung","projekt","lernstand","gruppenuebung","frage","deeperlearning","eigen"];
function offenBerechnen(v1){
 if(!v1)return [];
 const verw=new Set(S.d.plan.verworfen||[]),vorh=S.d.plan.eintraege;
 return (v1.eintraege||[]).filter(e=>e.typ==="modul"&&!e.erledigt&&!e.lang&&!e.fest&&!OFFEN_AUS.includes(e.mTyp)&&!verw.has(e.id)
  &&!vorh.some(x=>x.moduleId&&x.moduleId===e.moduleId)).map(e=>({...e,vonWoche:v1.woche}));
}
function offenHtml(){
 const o=S.d.offen||[];if(!o.length)return "";
 return `<div class="card wp-offen"><div class="wp-th"><h3>Noch offen aus der letzten Woche</h3><small>${o.length} Lernbaustein${o.length===1?"":"e"} nicht abgehakt</small></div><div class="wp-liste">${o.map(e=>{const f=FACH(e.fach);
  return `<div><span class="wp-fl" style="--fc:${f.c};--fb:${f.bg}">${esc(f.l)}</span><b>${esc(e.titel)}</b><small>${esc(artOf(e.mTyp).l)} · ${esc(dauerKurz(dauerInfo(e)))}</small><span class="wp-rowact"><button class="primary" onclick="wp.einplanen('offen','${e.id}')">Einplanen</button><button class="secondary" onclick="wp.offenWeg('${e.id}')">Nicht mehr nötig</button></span></div>`}).join("")}</div></div>`;
}
async function offenWeg(id){
 S.d.plan.verworfen=[...(S.d.plan.verworfen||[]),id];
 await speichern();neu();
}

/* ---------- Lernplan bis Schulaufgabe / Kurzarbeit (Schüler:innen) ---------- */
const FACH_ERKENNUNG=[[/\bP\/?P\b|Pä|Pädagogik|Psycholog/i,"paedagogik"],[/\bSWR\b|Sozialwirtschaft/i,"sozialwirtschaft"],[/\bCh\b|Chemie/i,"chemie"],[/\bD\b|Deutsch/i,"deutsch"],[/\bE\b|Englisch/i,"englisch"],[/\bM\b|Mathe/i,"mathematik"],[/\bG\b|Geschichte/i,"geschichte"]];
function lpBloecke(t){
 const a=Number(t.umfang==="kompakt"?3:t.umfang==="intensiv"?(t.art==="SA"?9:6):(t.art==="SA"?6:4));return a;
}
function lpVerteilung(t,heuteDate){
 const start=new Date(heuteDate.getFullYear(),heuteDate.getMonth(),heuteDate.getDate()),ende=parse(t.datum),tage=[];
 for(let x=new Date(start);x<ende;x=addD(x,1)){if((x.getDay()+6)%7<5)tage.push(new Date(x))}
 if(!tage.length)return [];
 const B=lpBloecke(t),n=tage.length,w=tage.map((_,i)=>1+i/Math.max(1,n-1)),sum=w.reduce((a,c)=>a+c,0);
 const alloc=w.map(x=>Math.min(2,Math.floor(B*x/sum)));
 let rest=B-alloc.reduce((a,c)=>a+c,0);
 const reihe=tage.map((_,i)=>i).sort((a,b)=>w[b]-w[a]||b-a);
 while(rest>0){let bewegt=false;for(const i of reihe){if(rest<=0)break;if(alloc[i]<2){alloc[i]++;rest--;bewegt=true}}if(!bewegt)break}
 return tage.map((d,i)=>({date:iso(d),blocks:alloc[i]})).filter(x=>x.blocks>0);
}
function lernplanBanner(){
 const heute=iso(new Date()),T=((S.d.lernplan&&S.d.lernplan.termine)||[]).filter(t=>t.datum>=heute).sort((a,b)=>a.datum.localeCompare(b.datum));
 const wann=t=>{const n=Math.round((parse(t.datum)-parse(heute))/864e5);return n===0?"heute":n===1?"morgen":"in "+n+" Tagen"};
 return `<div class="card wp-lp"><div class="wp-th"><h3>Lernplan bis zur Schulaufgabe oder Kurzarbeit</h3><button class="secondary" onclick="wp.lernplanForm()">Termin hinzufügen</button></div>
 ${T.length?`<div class="wp-liste">${T.map(t=>{const f=FACH(t.fach);return `<div><span class="wp-fl" style="--fc:${f.c};--fb:${f.bg}">${esc(f.l)}</span><b>${t.art==="SA"?"Schulaufgabe":"Kurzarbeit"} · ${TAGK[parse(t.datum).getDay()]}, ${esc(dkurz(t.datum))}</b><small>${wann(t)} · ${lpBloecke(t)} Lernzeiten</small><span class="wp-rowact"><button class="primary" onclick="wp.lernplanEinplanen('${t.id}')">In diese Woche einplanen</button><button class="secondary" onclick="wp.lernplanWeg('${t.id}')">Löschen</button></span></div>`}).join("")}</div>`
 :`<p class="wp-hint">Trage deine nächste Schulaufgabe oder Kurzarbeit ein. Die App verteilt dann Lernzeiten auf freie Plätze vor dem Termin, gegen Ende dichter.</p>`}</div>`;
}
function lernplanForm(){
 const heute=iso(new Date());
 modalOpen(`<div class="wp-artband" style="${artStyle('checkout')}">Lernplan</div><div class="kicker">LERNPLAN</div><h2>Schulaufgabe oder Kurzarbeit eintragen</h2><div class="form">
 <label>Aus dem Kalender übernehmen<select id="lpKal" onchange="wp.lernplanKal(this.value)"><option value="">Kalender wird geladen …</option></select></label>
 <label>Fach<select id="lpFach">${FAECHER.filter(f=>!["fpa","foerder","fachuebergreifend"].includes(f.k)).map(f=>`<option value="${f.k}">${esc(f.l)}</option>`).join("")}</select></label>
 <label>Art<select id="lpArt"><option value="SA">Schulaufgabe (SA)</option><option value="KU">Kurzarbeit (KU)</option></select></label>
 <label>Datum<input id="lpDatum" type="date" min="${heute}"></label>
 <label>Umfang der Vorbereitung<select id="lpUmfang"><option value="kompakt">kompakt (3 Lernzeiten)</option><option value="normal" selected>normal (SA 6, KU 4 Lernzeiten)</option><option value="intensiv">intensiv (SA 9, KU 6 Lernzeiten)</option></select></label>
 <small class="wp-hint">Eine Lernzeit dauert 45 Minuten. Du kannst die eingeplanten Lernzeiten jederzeit verschieben oder löschen.</small>
 <div class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button><button class="primary" onclick="wp.lernplanSave()">Speichern</button></div></div>`);
 qdocs("events").then(ev=>{
  const re=/\b(SA|KU)\b|Schulaufgabe|Kurzarbeit/i;
  S.lpEv=ev.filter(e=>re.test(String(e.title||""))&&String(e.start||e.date||"").slice(0,10)>=heute).sort((a,b)=>String(a.start||a.date).localeCompare(String(b.start||b.date))).slice(0,30);
  const sel=$("lpKal");if(!sel)return;
  sel.innerHTML=`<option value="">${S.lpEv.length?"– Termin wählen –":"Keine passenden Kalendertermine gefunden"}</option>`+S.lpEv.map((e,i)=>`<option value="${i}">${esc(dkurz(String(e.start||e.date).slice(0,10)))} · ${esc(e.title)}</option>`).join("");
 }).catch(()=>{const sel=$("lpKal");if(sel)sel.innerHTML=`<option value="">Kalender nicht verfügbar</option>`});
}
function lernplanKal(i){
 const e=(S.lpEv||[])[Number(i)];if(!e)return;
 const t=String(e.title||"");
 $("lpDatum").value=String(e.start||e.date).slice(0,10);
 $("lpArt").value=/\bKU\b|Kurzarbeit/i.test(t)?"KU":"SA";
 const f=FACH_ERKENNUNG.find(([re])=>re.test(t));if(f&&$("lpFach").querySelector(`option[value="${f[1]}"]`))$("lpFach").value=f[1];
}
async function lernplanSpeichern(){
 try{await fb.setDoc(ref("wpLernplan",uid()),{uid:uid(),termine:S.d.lernplan.termine,updatedAt:fb.serverTimestamp()})}catch(e){console.error(e);fb.toast("Speichern nicht möglich.");throw e}
}
async function lernplanSave(){
 const datum=$("lpDatum").value;if(!datum)return fb.toast("Bitte ein Datum wählen.");
 if(datum<iso(new Date()))return fb.toast("Das Datum liegt in der Vergangenheit.");
 S.d.lernplan.termine=[...(S.d.lernplan.termine||[]),{id:nid(),fach:$("lpFach").value,art:$("lpArt").value,datum,umfang:$("lpUmfang").value}].slice(-20);
 try{await lernplanSpeichern();fb.closeModal();fb.toast("Termin gespeichert.");neu()}catch(e){}
}
async function lernplanWeg(id){
 S.d.lernplan.termine=(S.d.lernplan.termine||[]).filter(t=>t.id!==id);
 S.d.plan.eintraege=S.d.plan.eintraege.filter(e=>!(e.lp===id&&!e.erledigt));
 try{await lernplanSpeichern();await speichern();neu()}catch(e){}
}
async function lernplanEinplanen(id){
 const t=(S.d.lernplan.termine||[]).find(x=>x.id===id);if(!t)return;
 const mo=parse(S.woche),fr=addD(mo,4);
 S.d.plan.eintraege=S.d.plan.eintraege.filter(e=>!(e.lp===id&&!e.erledigt));
 const plan=lpVerteilung(t,new Date()).filter(x=>{const d=parse(x.date);return d>=mo&&d<=fr});
 if(!plan.length)return fb.toast("In dieser Woche ist keine Lernzeit mehr vor dem Termin.");
 const pref=[7,8,6,9,5,4,3,2,10,1];let ok=0,fehlt=0;
 for(const x of plan){
  const d=Math.round((parse(x.date)-mo)/864e5);
  for(const len of x.blocks===2?[2,1]:[1]){
   const h=pref.find(hh=>frei(d,hh,len));if(h==null)continue;
   S.d.plan.eintraege.push({id:nextId(),typ:"eigen",mTyp:"eigen",titel:"Lernplan "+t.art+": "+FACH(t.fach).l,fach:t.fach,d,h,len,dauer:len===2?"90":"45",woche:S.woche,erledigt:false,lp:t.id});ok+=len;break;
  }
  if(!S.d.plan.eintraege.some(e=>e.lp===id&&e.d===d))fehlt+=x.blocks;
 }
 await speichern();
 fb.toast(ok?`${ok} Lernzeit${ok===1?"":"en"} eingeplant${fehlt?` (${fehlt} ohne freien Platz)`:""}.`:"Es war kein freier Platz vorhanden.");
 neu();
}

/* ---------- Persönliche Hinweise: Impuls, Lernstandsgespräch, Ziel ---------- */
function persHtml(){
 let h="";
 const ip=S.d.impulsPers;if(ip&&ip.text)h+=`<div class="wp-impuls"><b>Persönlicher Impuls von ${esc(ip.von||"deiner Lehrkraft")}:</b> ${esc(ip.text)}</div>`;
 (S.d.gesp||[]).forEach(g=>{h+=`<div class="wp-gesp"><span><b>Dein Lernstandsgespräch steht an:</b> ${TAGEL[g.d]}, ${esc(dm(addD(parse(S.woche),g.d)))} · ${esc(zeitBereich(g.h,g.len||1))}${g.lehrkraft?" · "+esc(g.lehrkraft):""}${g.raum?" · Raum "+esc(g.raum):""}</span><button class="secondary" onclick="wp.info('gesp','${g.id}')">Vorbereiten</button></div>`});
 const z=S.d.zielGespraech;if(z&&z.ziel)h+=`<div class="wp-ziel-ls"><b>Mein Ziel aus dem Lernstandsgespräch:</b> ${esc(z.ziel)}</div>`;
 return h;
}
const GESPRAECH_FRAGEN=["Was ist mir in den letzten Wochen gut gelungen?","Wo brauche ich Unterstützung, und von wem?","Welche Lernbausteine sind noch offen, und warum?","Welches Ziel setze ich mir bis zum nächsten Gespräch?"];
function infoGesp(id){
 const g=(S.d.gesp||[]).find(x=>x.id===id);if(!g)return;
 modalOpen(`<div class="wp-artband" style="${artStyle("lernstand")}">Lernstandsgespräch</div><div class="kicker">DEIN TERMIN</div><h2>${TAGEL[g.d]}, ${esc(dm(addD(parse(S.woche),g.d)))}</h2><p>${esc(zeitBereich(g.h,g.len||1))}${g.lehrkraft?" · "+esc(g.lehrkraft):""}${g.raum?" · Raum "+esc(g.raum):""}</p>
 <p class="wp-hint">Fester Termin: Deine Lehrkraft spricht mit dir über deinen Lernstand. Wenn dort schon etwas in deinem Plan steht, geht das Gespräch vor.</p>
 <h4>So bereitest du dich vor</h4><ol class="wp-steps"><li>Sieh dir in der Ansicht „Geleistet“ an, was du schon erledigt hast.</li>${GESPRAECH_FRAGEN.map(f=>`<li>${esc(f)}</li>`).join("")}</ol>
 <div class="form-actions"><button class="secondary" onclick="closeModal();wp.ansicht('geleistet')">Zu „Geleistet“</button>${g.bestaetigt?'<span class="pill ok">Gesehen</span>':`<button class="primary" onclick="wp.gespGesehen('${g.id}')">Termin gesehen</button>`}</div>`);
}
async function gespGesehen(id){
 try{await fb.updateDoc(ref("wpGespraeche",id),{bestaetigt:true,updatedAt:fb.serverTimestamp()});const g=(S.d.gesp||[]).find(x=>x.id===id);if(g)g.bestaetigt=true;fb.closeModal();fb.toast("Danke.")}catch(e){console.error(e);fb.toast("Nicht möglich.")}
}

/* ---------- Lehrkräfte: Dossier, Lernstandsgespräch ansetzen, Impuls ---------- */
async function dossier(u){
 const x=(S.d.sts||[]).find(y=>y.u.uid===u),name=x?fb.zkAnzeige(x.u):"Schüler:in";
 const [stat,gesp,ziel,notiz]=await Promise.all([qdocs("wpStatus",W("uid",u)).catch(()=>[]),gdoc("wpGespraeche",u+"_"+S.woche),gdoc("wpZiele",u),gdoc("wpGespraechNotizen",u)]);
 const st=stat.sort((a,b)=>String(a.woche).localeCompare(String(b.woche))).slice(-10);
 const sum=k=>st.reduce((a,s)=>a+(s[k]||0),0),quote=sum("modGesamt")?Math.round(sum("modErledigt")/sum("modGesamt")*100):0;
 const mx=Math.max(1,...st.map(s=>Math.max(s.geplantMin||0,s.erledigtMin||0)));
 const geteilt=st.filter(s=>s.geteilt).slice(-4);
 const plaene=(await Promise.all(geteilt.map(s=>gdoc("wpPlan",u+"_"+s.woche)))).filter(p=>p&&(p.ziel||p.rueckblick));
 const dtl=gesp||{d:S.tag,h:1,len:1,lehrkraft:fb.profile?.displayName||"",raum:""};
 modalOpen(`<div class="wp-artband" style="${artStyle("lernstand")}">Lernstandsgespräch</div><div class="kicker">VORBEREITUNG</div><h2>${esc(name)}</h2>
 <div class="wp-kpis wp-kpis2"><div class="card"><b>${st.length}</b><small>Wochen mit Plan</small></div><div class="card"><b>${quote} %</b><small>Lernbausteine erledigt</small></div><div class="card"><b>${std(sum("erledigtMin"))}</b><small>Lernzeit erledigt (von ${std(sum("geplantMin"))} geplant)</small></div><div class="card"><b>${sum("checkouts")}</b><small>Check-outs erledigt</small></div></div>
 ${st.length?`<h4>Lernzeit pro Woche</h4><div class="wp-dwb">${st.map(s=>`<div title="${esc(wochenText(s.woche))}: geplant ${std(s.geplantMin||0)}, erledigt ${std(s.erledigtMin||0)}"><span><i class="g" style="height:${Math.round((s.geplantMin||0)/mx*100)}%"></i><i class="e" style="height:${Math.round((s.erledigtMin||0)/mx*100)}%"></i></span><small>KW${kwNr(parse(s.woche))}</small></div>`).join("")}</div><div class="wp-leg2"><span><i style="background:#cfe1f2"></i>geplant</span><span><i style="background:#8fc27a"></i>erledigt</span></div>`:`<p class="wp-leer">Noch keine Wochenzahlen vorhanden.</p>`}
 ${plaene.length?`<h4>Aus geteilten Plänen</h4>${plaene.map(p=>`<div class="wp-zitat"><small>${esc(wochenText(p.woche))}</small>${p.ziel?`<p><b>Wochenziel:</b> ${esc(p.ziel)}</p>`:""}${p.rueckblick?`<p><b>Rückblick:</b> ${esc(p.rueckblick)}</p>`:""}</div>`).join("")}`:`<p class="wp-hint">Pläne, Ziele und Rückblicke sind privat und nur sichtbar, wenn die Person ihren Plan teilt.</p>`}
 <h4>Gesprächsleitfaden</h4><ol class="wp-steps">${GESPRAECH_FRAGEN.map(f=>`<li>${esc(f)}</li>`).join("")}</ol>
 <h4>Termin${gesp?" (gesetzt)":""}</h4><div class="form wp-gform">
  <label>Tag<select id="gsD">${TAGEL.map((t,i)=>`<option value="${i}" ${i===dtl.d?"selected":""}>${t}, ${dm(addD(parse(S.woche),i))}</option>`).join("")}</select></label>
  <label>Beginn<select id="gsH">${[...Array(10)].map((_,i)=>`<option value="${i+1}" ${i+1===dtl.h?"selected":""}>${i+1}. Stunde (${esc(zeiten()[i]||"")})</option>`).join("")}</select></label>
  <label>Dauer<select id="gsLen"><option value="1" ${dtl.len!==2?"selected":""}>45 Minuten</option><option value="2" ${dtl.len===2?"selected":""}>90 Minuten</option></select></label>
  <label>Lehrkraft<input id="gsLk" maxlength="60" value="${esc(dtl.lehrkraft||"")}"></label>
  <label>Raum (optional)<input id="gsRaum" maxlength="20" value="${esc(dtl.raum||"")}"></label>
  <div class="form-actions">${gesp?`<button class="secondary" onclick="wp.gespAbsagen('${u}')">Gespräch absagen</button>`:""}<button class="primary" onclick="wp.gespSetzen('${u}')">${gesp?"Termin ändern":"Lernstandsgespräch ansetzen"}</button></div></div>
 <h4>Zielvereinbarung und Notiz</h4><div class="form">
  <label>Ziel bis zum nächsten Gespräch (sichtbar für die Schüler:in)<textarea id="gsZiel" rows="2" maxlength="300">${esc((ziel&&ziel.ziel)||"")}</textarea></label>
  <label>Notiz (nur für Lehrkräfte)<textarea id="gsNotiz" rows="3" maxlength="1000">${esc((notiz&&notiz.text)||"")}</textarea></label>
  <div class="form-actions"><button class="secondary" onclick="closeModal()">Schließen</button><button class="primary" onclick="wp.dossierSpeichern('${u}')">Ziel und Notiz speichern</button></div></div>`);
}
async function gespSetzen(u){
 const d=Number($("gsD").value),h=Number($("gsH").value),len=Number($("gsLen").value)||1;
 if(h+len-1>10)return fb.toast("Das Gespräch reicht über den Tag hinaus.");
 const x=(S.d.sts||[]).find(y=>y.u.uid===u);
 try{
  await fb.setDoc(ref("wpGespraeche",u+"_"+S.woche),{uid:u,pseudo:x?fb.zkAnzeige(x.u):"",woche:S.woche,d,h,len,lehrkraft:$("gsLk").value.trim(),raum:$("gsRaum").value.trim(),status:"live",bestaetigt:false,createdBy:uid(),createdAt:fb.serverTimestamp(),updatedAt:fb.serverTimestamp()});
  fb.closeModal();fb.toast("Lernstandsgespräch angesetzt. Die Schüler:in sieht es im Wochenplan.");neu();
 }catch(e){console.error(e);fb.toast("Nicht möglich.")}
}
async function gespAbsagen(u){
 if(!confirm("Dieses Lernstandsgespräch absagen?"))return;
 try{await fb.deleteDoc(ref("wpGespraeche",u+"_"+S.woche));fb.closeModal();fb.toast("Gespräch abgesagt.");neu()}catch(e){console.error(e);fb.toast("Nicht möglich.")}
}
async function dossierSpeichern(u){
 try{
  const ziel=$("gsZiel").value.trim().slice(0,300),text=$("gsNotiz").value.trim().slice(0,1000);
  await fb.setDoc(ref("wpZiele",u),{uid:u,ziel,von:fb.profile?.displayName||"Lehrkraft",updatedAt:fb.serverTimestamp()});
  await fb.setDoc(ref("wpGespraechNotizen",u),{uid:u,text,updatedAt:fb.serverTimestamp()});
  fb.toast("Gespeichert.");
 }catch(e){console.error(e);fb.toast("Nicht möglich.")}
}
function fbFach(k){S.fbFach=k;neu()}

/* ---------- Bausteine teilen: Export / Import (klassenübergreifend) ---------- */
function modulExport(){
 const liste=S.d.module.map(m=>{const {id,createdAt,updatedAt,createdBy,woche,status,...rest}=m;return rest});
 if(!liste.length)return fb.toast("Keine Lernbausteine zum Exportieren.");
 const dat={art:"wp-lernbausteine",version:1,erstellt:iso(new Date()),module:liste};
 const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(dat,null,1)],{type:"application/json"}));a.download="lernbausteine-"+S.woche+".json";document.body.appendChild(a);a.click();a.remove();
 fb.toast(liste.length+" Lernbausteine exportiert.");
}
async function modulImport(inp){
 const f=inp.files&&inp.files[0];inp.value="";if(!f)return;
 try{
  const dat=JSON.parse(await f.text());
  if(!dat||dat.art!=="wp-lernbausteine"||!Array.isArray(dat.module))throw new Error("format");
  const ok=dat.module.filter(m=>m&&typeof m.titel==="string"&&ARTEN[m.typ]).slice(0,60);
  if(!ok.length)return fb.toast("Die Datei enthält keine passenden Lernbausteine.");
  if(!confirm(ok.length+" Lernbausteine als Entwurf in diese Woche übernehmen?"))return;
  const bt=fb.writeBatch(fb.db);
  ok.forEach(m=>{const d={titel:String(m.titel).slice(0,80),fach:FAECHER.some(x=>x.k===m.fach)?m.fach:"fachuebergreifend",typ:m.typ,dauer:String(m.dauer||"45"),len:Number(m.len)||1,beschr:String(m.beschr||"").slice(0,400),gestaltung:m.gestaltung&&typeof m.gestaltung==="object"?m.gestaltung:{},rallye:Array.isArray(m.rallye)?m.rallye.slice(0,30):[],anhaenge:(Array.isArray(m.anhaenge)?m.anhaenge:[]).filter(a=>a&&/^https:\/\//.test(a.url||"")).slice(0,10),route:"",link:/^https:\/\//.test(m.link||"")?m.link:"",pflicht:!!m.pflicht,mehrfach:!!m.mehrfach,fixTag:m.fixTag==null?"":m.fixTag,fixStd:m.fixStd||1,woche:S.woche,status:"entwurf",createdBy:uid(),createdAt:fb.serverTimestamp(),updatedAt:fb.serverTimestamp()};bt.set(fb.doc(col("wpModule")),d)});
  await bt.commit();fb.toast(ok.length+" Lernbausteine als Entwurf übernommen.");neu();
 }catch(e){console.error(e);fb.toast("Die Datei konnte nicht gelesen werden.")}
}

/* =========================================================
   Öffentliche Schnittstelle
   ========================================================= */
Object.assign(wpPublic,{
 ltab:t=>{S.tab=t;neu()},
 voll:()=>vollSetzen(!S.voll),
 vorschau,rpStart,rpWeiter,rpPruefen,rpWahl,rpRhAdd,rpRhReset,rpHinweis,rallyAdd,rallyDel,rallyMove,rallySet,slotModal,einplanen,einplanenOk,anhHoch,anhWeg,artVorschau,anwKlick,anwAlle,anwPlanung,foldMerk:(id,o)=>{S.fold=S.fold||{};S.fold[id]=o},planAnsehen,impuls,modulForm,modulSave,modulWeg,modulKopie,zeitenForm,zeitenSave,
 einfForm,einfBearbeiten:id=>einfForm(id),einfSave,einfWeg,slotForm,slotBearbeiten:id=>slotForm(id),slotSave,slotWeg,
 chatSenden,teamNotiz,todoNeu,todoToggle,todoWeg,freigeben,vorwoche,angebotMod,
 reiheScroll:d=>{const r=$("wpReihe");if(r)r.scrollBy({left:d*Math.max(200,r.clientWidth*.7),behavior:"smooth"})},fuerAlle,frageVormerken,dlVorlage,fbForm,fbSenden,fbCsv,fbFach,offenWeg,lernplanForm,lernplanKal,lernplanSave,lernplanWeg,lernplanEinplanen,gespGesehen,dossier,gespSetzen,gespAbsagen,dossierSpeichern,modulExport,modulImport
});
window.wp=wpPublic;

export async function wpRender(){
 S.armed=null;S.voll=false;document.body.classList.remove("wp-voll-body");
 return `<div id="wpRoot" class="wp">${await inhalt()}</div>`;
}
