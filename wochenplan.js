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
const MTYP={checkout:{l:"Check-out",i:""},einfuehrung:{l:"Einführung",i:""},baustein:{l:"Kurs / Training",i:""},lernen:{l:"Lernbaustein",i:""},vertiefung:{l:"Vertiefung",i:""},projekt:{l:"Projekt",i:""}};
/* Feste Termine der Lehrkräfte (Collection wpEinfuehrungen, Feld art) */
const TART={einfuehrung:{l:"Einführung",i:"",kick:"EINFÜHRUNG",neu:"Neue Einführung",edit:"Einführung bearbeiten",ph:"z. B. Einführung Lernbereich 2",hint:"Fester Termin – die Lehrkraft führt ein, danach steuerst du selbst.",weg:"Diese Einführung löschen?"},lernstand:{l:"Lernstandsgespräch",i:"",kick:"LERNSTANDSGESPRÄCH",neu:"Neues Lernstandsgespräch",edit:"Lernstandsgespräch bearbeiten",ph:"z. B. Lernstandsgespräch Gruppe A",hint:"Fester Termin – deine Lehrkraft spricht mit dir über deinen Lernstand. Bereite dich mit deinem Lernjournal vor.",weg:"Dieses Lernstandsgespräch löschen?"}};
const tart=e=>TART[e&&e.art]||TART.einfuehrung;
const ROUTEN=[["","— keine —"],["fachaufsatz","Fachaufsatz-Training"],["lernwerkzeuge","Lern-Werkzeuge"],["karteikarten","Karteikarten"],["lernstand","Lernstandsmessung"],["kompetenz","Kompetenzwerkstatt"],["projekte","Projekte"],["praktikum","fpA"],["journal","Lernjournal"],["lernpfad","Lernpfad"],["faecher","Fächer & Lernbereiche"],["methoden","Lernmethoden"],["resilienz","Resilienz & Respressi"],["fokus-timer","Fokus-Timer"]];
const TAGE=["Mo","Di","Mi","Do","Fr"],TAGEL=["Montag","Dienstag","Mittwoch","Donnerstag","Freitag"];
const ZEITEN_STD=["08:00","08:45","09:45","10:30","11:30","12:15","13:15","14:00","15:00","15:45"];
const DAUER=45; /* Minuten je Unterrichtsstunde */
/* Flexible Dauer der Lernbausteine: 15–45 Min. im 5-Min.-Takt, dann 60/90/120, Tag(e), Wochen */
const DAUER_OPT=[["15","15 Minuten"],["20","20 Minuten"],["25","25 Minuten"],["30","30 Minuten"],["35","35 Minuten"],["40","40 Minuten"],["45","45 Minuten"],["60","60 Minuten"],["90","90 Minuten"],["120","120 Minuten"],["tag","Ein Tag"],["2tage","Zwei Tage"],["1w","Eine Woche"],["2w","Zwei Wochen"],["3w","Drei Wochen"]];
const LANG_WOCHEN={tag:1,"2tage":1,"1w":1,"2w":2,"3w":3};
function dauerInfo(x){
 const c=x&&x.dauer?String(x.dauer):"";
 if(!c){const len=(x&&x.len)||1;return {code:"",label:len*DAUER+" Minuten",min:len*DAUER,len,lang:false,wochen:1}}
 const o=DAUER_OPT.find(o=>o[0]===c)||DAUER_OPT[6];
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
 lernstand:{l:"Lernstandsgespräch",c:"#c0568f",bg:"#f6e2ed"}
};
const ART_REIHE=["einfuehrung","lernen","projekt","vertiefung","baustein","checkout","lernstand"];
const artOf=t=>ARTEN[t]||ARTEN.lernen;
const artStyle=t=>`--ac:${artOf(t).c};--ab:${artOf(t).bg}`;
function artLegende(){return `<div class="wp-legende" aria-label="Farben der Lernbausteine">${ART_REIHE.map(k=>`<span class="wp-art" style="${artStyle(k)}">${esc(artOf(k).l)}</span>`).join("")}</div>`}
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
function artVorschau(t){const b=$("mfBand");if(!b)return;b.setAttribute("style",artStyle(t));b.textContent=artOf(t).l;const w=$("mfWrap");if(w)w.setAttribute("style",artStyle(t))}
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
 S.d.module=[...m1,...m2].sort((a,b)=>String(a.fach).localeCompare(String(b.fach))||String(a.titel).localeCompare(String(b.titel),"de"));
 S.d.einf=einf;S.d.slots=slots;S.d.wochenDoc=wo;
}
async function ladeSchueler(){
 await ladeAllgemein();const w=S.woche,me=uid();
 const [plan,belegt,mein,anfV,anfT,tutoren,v1,v2]=await Promise.all([
  gdoc("wpPlan",me+"_"+w),qdocs("wpBelegt").catch(()=>[]),qdocs("wpBuchungen",W("uid",me)).catch(()=>[]),
  qdocs("wpAnfragen",W("vonUid",me)).catch(()=>[]),qdocs("wpAnfragen",W("tutorUid",me)).catch(()=>[]),qdocs("wpTutor").catch(()=>[]),
  gdoc("wpPlan",me+"_"+iso(addD(parse(w),-7))),gdoc("wpPlan",me+"_"+iso(addD(parse(w),-14)))]);
 S.d.laufend=[[v1,1],[v2,2]].flatMap(([pp,k])=>pp?(pp.eintraege||[]).filter(e=>e.lang&&!e.erledigt&&dauerInfo(e).wochen>k).map(e=>({...e,woche:pp.woche})):[]);
 S.d.plan=plan||{id:me+"_"+w,uid:me,woche:w,eintraege:[],ziel:"",rueckblick:"",geteilt:false};
 if(!Array.isArray(S.d.plan.eintraege))S.d.plan.eintraege=[];
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
 const docu={uid:me,woche:S.woche,eintraege:p.eintraege,ziel:p.ziel||"",rueckblick:p.rueckblick||"",geteilt:!!p.geteilt,updatedAt:fb.serverTimestamp()};
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
  return `<div class="wp-b einf art ${b.art==="lernstand"?"lernstand":""}${b.entwurf?" entwurf":""}" style="${st};--fc:${f.c};--fb:${f.bg};${artStyle(b.art==="lernstand"?"lernstand":"einfuehrung")}" ${attr}><span class="wp-lock" title="Fester Termin der Lehrkraft">${tart(b).i}</span><b>${esc(b.titel)}</b><small>${esc(b.sub)}${b.entwurf?" · Entwurf":""}</small></div>`}
 if(b.k==="slot"){return `<div class="wp-b termin${b.entwurf?" entwurf":""}" style="${st}" onclick="wp.slotBearbeiten('${b.id}')"><span class="wp-ic"></span><b>${esc(b.titel)}</b><small>${esc(b.sub)}</small></div>`}
 if(b.k==="termin"){return `<div class="wp-b termin" style="${st}" onclick="wp.info('termin','${b.id}')"><span class="wp-ic"></span><b>${esc(b.titel)}</b><small>${esc(b.sub)}</small></div>`}
 if(b.k==="tutor"){return `<div class="wp-b tutor${b.offen?" offen":""}" style="${st}" onclick="wp.info('tutor','${b.id}')"><span class="wp-ic"></span><b>${esc(b.titel)}</b><small>${esc(b.sub)}</small></div>`}
 const t=b.typ,cls="wp-b plan "+t+(b.mTyp?" m-"+b.mTyp:"")+(t==="modul"&&b.mTyp?" art":"")+(b.erledigt?" done":"");
 const ic=t==="auszeit"?"":t==="eigen"?"":(MTYP[b.mTyp]?.i||"");
 return `<div class="${cls}" style="${st};--fc:${f.c};--fb:${f.bg};${t==="modul"&&b.mTyp?artStyle(b.mTyp):""}" draggable="true" ondragstart="wp.dragStart(event,'move','${b.id}')" onclick="wp.info('plan','${b.id}')"><span class="wp-ic">${ic}</span><b>${esc(b.titel)}</b><small>${esc(f.l)} · ${dauerKurz(dauerInfo(b))}</small>${b.erledigt?'<span class="wp-ok">✓</span>':""}</div>`;
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
   h+=`<div class="wp-c${d===S.tag?" tag-on":""}" style="grid-column:${d+2};grid-row:${r+1}" ondragover="wp.over(event)" ondragleave="wp.leave(event)" ondrop="wp.drop(event,${d},${r})" onclick="wp.zelle(${d},${r})"></div>`}
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
 {typ:"termin",ic:"",t:"Termin bei Lehrkraft",s:"fachliche Frage"},
 {typ:"tutor",ic:"",t:"Tutor:in buchen",s:"Mitschüler:in hilft"},
 {typ:"kompetenz",ic:"",t:"Kompetenz anfragen",s:"fürs Projekt"},
 {typ:"auszeit",ic:"",t:"Auszeit",s:"kurz regenerieren"},
 {typ:"eigen",ic:"",t:"Eigene Lernzeit",s:"selbst gewählt"}
];
function modulTile(m){
 const f=FACH(m.fach),pl=S.d.plan.eintraege.filter(e=>e.moduleId===m.id),n=pl.length,done=pl.some(e=>e.erledigt);
 const armed=S.armed&&S.armed.id===m.id;
 return `<div class="wp-tile art m-${esc(m.typ)}${n?" geplant":""}${done?" done":""}${armed?" armed":""}" style="--fc:${f.c};--fb:${f.bg};${artStyle(m.typ)}" draggable="true" ondragstart="wp.dragStart(event,'modul','${m.id}')" onclick="wp.arm('modul','${m.id}')" title="${esc(m.beschr||m.titel)}">
 <span class="wp-tic">${MTYP[m.typ]?.i||""}</span><b>${esc(m.titel)}</b><small>${esc(f.l)} · ${esc(dauerKurz(dauerInfo(m)))}${m.pflicht?" · Pflicht":""}${n?" · ✓ geplant":""}</small></div>`;
}
function leisteHtml(){
 const mods=S.d.module.filter(m=>S.filter==="alle"||m.fach===S.filter);
 const fs=[...new Set(S.d.module.map(m=>m.fach))];
 let h=`<div class="wp-leiste card"><div class="wp-lh"><h3>Lernbausteine nach Fächern</h3>${artLegende()}<div class="wp-chips"><button class="${S.filter==="alle"?"on":""}" onclick="wp.filter('alle')">Alle</button>${fs.map(k=>`<button class="${S.filter===k?"on":""}" style="--fc:${FACH(k).c}" onclick="wp.filter('${k}')">${esc(FACH(k).l)}</button>`).join("")}</div></div>`;
 if(!S.d.module.length)h+=`<p class="wp-leer">Für diese Woche hat dein Team noch keine Lernbausteine freigegeben.</p>`;
 const grp={};mods.forEach(m=>(grp[m.fach]=grp[m.fach]||[]).push(m));
 h+=`<div class="wp-zeilen">`;
 Object.keys(grp).forEach(k=>{h+=`<div class="wp-zeile"><span class="wp-fl" style="--fc:${FACH(k).c};--fb:${FACH(k).bg}">${esc(FACH(k).l)}</span><div class="wp-tiles">${grp[k].map(modulTile).join("")}</div></div>`});
 h+=`<div class="wp-zeile"><span class="wp-fl sonder">Immer dabei</span><div class="wp-tiles">${SONDER.map(s=>`<div class="wp-tile sonder s-${s.typ}${S.armed&&S.armed.id===s.typ?" armed":""}" draggable="true" ondragstart="wp.dragStart(event,'sonder','${s.typ}')" onclick="wp.arm('sonder','${s.typ}')"><span class="wp-tic">${s.ic}</span><b>${s.t}</b><small>${s.s}</small></div>`).join("")}</div></div></div>`;
 return h+"</div>";
}
function langHtml(){
 const own=S.d.plan.eintraege.filter(e=>e.lang),fr=S.d.laufend||[];
 if(!own.length&&!fr.length)return "";
 const row=(e,fremd)=>{const I=dauerInfo(e),von=e.woche||S.woche,bis=iso(addD(parse(von),7*(I.wochen-1)));
  const zeit=I.wochen>1?"KW "+kwNr(parse(von))+"–"+kwNr(parse(bis)):(e.startTag>=0?TAGE[e.startTag]+(I.code==="2tage"?" + "+TAGE[Math.min(4,e.startTag+1)]:""):"diese Woche");
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
 return `<div class="wp-unten"><div class="card"><h3>So startest du</h3><ol class="wp-steps"><li><b>Feste Termine ansehen.</b> Die Einführungen und Lernstandsgespräche deiner Lehrkräfte stehen schon im Plan.</li><li><b>Lernbausteine einplanen.</b> Ziehe einen Lernbaustein aus der Leiste auf einen freien Platz – oder tippe erst den Lernbaustein, dann den Platz.</li><li><b>Hilfe & Pausen mitdenken.</b> Termin, Tutor:in oder Auszeit sind eigene Bausteine.</li><li><b>Abhaken.</b> Tippe auf einen Eintrag und markiere ihn als erledigt.</li></ol></div>
 <div class="card"><h3>Meine Woche in Zahlen</h3><div class="wp-zahlen">
 <div><b>${std(k.geplantMin)}</b><small>Lernzeit geplant</small></div><div><b>${std(k.erledigtMin)}</b><small>davon erledigt</small></div>
 <div><b>${k.modGeplant}/${k.modGesamt}</b><small>Lernbausteine eingeplant</small></div><div><b>${k.checkouts}</b><small>Check-outs erledigt</small></div>
 <div><b>${k.termine+k.tutoring}</b><small>Termine & Tutoring</small></div><div><b>${k.auszeiten}</b><small>Auszeiten</small></div></div></div></div>`;
}
function ansichtSwitch(){return `<div class="wp-seg"><button class="${S.ansicht==="verplant"?"on":""}" onclick="wp.ansicht('verplant')">Verplant</button><button class="${S.ansicht==="geleistet"?"on":""}" onclick="wp.ansicht('geleistet')">✓ Geleistet</button></div>`}
function armedName(){const a=S.armed;if(!a)return "";if(a.kind==="modul")return S.d.module.find(m=>m.id===a.id)?.titel||"Lernbaustein";return SONDER.find(s=>s.typ===a.id)?.t||"Baustein"}

async function schuelerHtml(){
 if(S.ansicht==="geleistet")return await geleistetHtml();
 await ladeSchueler();
 const wd=S.d.wochenDoc,p=S.d.plan;
 const offen=S.d.anfT.filter(a=>a.status==="offen").length;
 let h=`<div class="wp-head"><div><div class="kicker">MEINE WOCHE</div><h1>Mein Wochenplan</h1><p>Die Lehrkräfte führen ein – den Rest steuerst du selbst.</p></div><div class="wp-actions">${ansichtSwitch()}<button class="secondary" onclick="wp.inbox()">Anfragen${offen?` <span class="wp-badge">${offen}</span>`:""}</button><button class="secondary" onclick="wp.angebot()">Mein Angebot</button></div></div>`;
 h+=`<div class="wp-bar2">${wochenKopf()}<label class="wp-ziel">Wochenziel <input id="wpZiel" maxlength="120" value="${esc(p.ziel||"")}" placeholder="Was willst du diese Woche schaffen?" onchange="wp.ziel(this.value)"></label></div>`;
 if(wd&&wd.impuls)h+=`<div class="wp-impuls"><b>Impuls deines Teams:</b> ${esc(wd.impuls)}</div>`;
 if(S.armed)h+=`<div class="wp-armed">Ausgewählt: <b>${esc(armedName())}</b> – tippe auf einen freien Platz im Plan. <button class="secondary" onclick="wp.arm(null)">Abbrechen</button></div>`;
 h+=langHtml()+tageTabs()+rasterHtml()+leisteHtml()+fortschrittHtml()+startHtml();
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
async function neu(){const r=$("wpRoot");if(!r)return;const y=window.scrollY;r.innerHTML=await inhalt();window.scrollTo(0,y)}
const modalOpen=h=>fb.modal(`<button class="modal-close" onclick="closeModal()">×</button>${h}`);
const nextId=()=>nid();

function payloadVon(ev){try{return JSON.parse(ev.dataTransfer.getData("text/plain"))}catch(e){return S.drag||null}}

async function setze(pl,d,h){
 if(!pl)return;
 if(pl.kind==="move"){
  const e=S.d.plan.eintraege.find(x=>x.id===pl.id);if(!e)return;
  if(!frei(d,h,e.len||1,e.id))return fb.toast("Dort ist nicht genug Platz.");
  e.d=d;e.h=h;await speichern();return neu();
 }
 if(pl.kind==="modul"){
  const m=S.d.module.find(x=>x.id===pl.id);if(!m)return;
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
function modalAuszeit(d,h){
 modalOpen(`<div class="kicker">AUSZEIT</div><h2>Kurze Auszeit einplanen</h2><p>Regeneration gehört zum Lernen. Deine Auszeiten sind <b>nur für dich</b> sichtbar und zählen nicht in der Statistik der Lehrkräfte.</p>
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
 modalOpen(`<div class="kicker">EIGENE LERNZEIT</div><h2>Eigene Lernzeit einplanen</h2>
 <div class="form"><label>Was willst du tun?<input id="egTitel" maxlength="60" placeholder="z. B. Vokabeln wiederholen"></label>
 <label>Fach<select id="egFach">${FAECHER.map(f=>`<option value="${f.k}">${esc(f.l)}</option>`).join("")}</select></label>
 <label>Dauer<select id="egLen"><option value="1">45 Minuten</option>${frei(d,h,2)?'<option value="2">90 Minuten</option>':""}</select></label>${fb.dsHinweis()}
 <div class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button><button class="primary" onclick="wp.eigenSetzen(${d},${h})">Einplanen</button></div></div>`);
}
async function eigenSetzen(d,h){
 const t=$("egTitel").value.trim();if(t.length<2)return fb.toast("Bitte beschreibe kurz, was du tun willst.");
 const len=Number($("egLen").value)||1;if(!frei(d,h,len))return fb.toast("Dort ist nicht genug Platz.");
 S.d.plan.eintraege.push({id:nextId(),typ:"eigen",titel:t,fach:$("egFach").value,d,h,len,erledigt:false});
 fb.closeModal();await speichern();neu();
}
/* ---------- Termin bei Lehrkraft ---------- */
function modalTermin(d,h){
 const me=uid(),eigene=S.d.buch.length;
 const sl=[...S.d.slots].sort((a,b)=>((a.d===d&&a.h===h)?0:1)-((b.d===d&&b.h===h)?0:1)||a.d-b.d||a.h-b.h);
 modalOpen(`<div class="kicker">TERMIN BEI EINER LEHRKRAFT</div><h2>Fachliche Frage klären</h2><p>Wähle einen freien Termin. Die Lehrkraft sieht dein Pseudonym und deine Frage – sonst niemand.</p>
 <label class="form"><span>Deine Frage (kurz)</span><textarea id="wpFrage" maxlength="200" rows="2" placeholder="Worum geht es? z. B. „Aufgabe 3 zur Gleichung – wie komme ich auf den Ansatz?“"></textarea></label>${fb.dsHinweis()}
 ${eigene>=2?'<p class="wp-warn">Du hast diese Woche schon 2 Termine gebucht. Sage erst einen ab, wenn du einen weiteren möchtest.</p>':""}
 <div class="wp-slotliste">${sl.length?sl.map(s=>{
  const bel=S.d.belegt.has(s.id),mein=S.d.buch.some(b=>b.id===s.id),platz=frei(s.d,s.h,s.len||1);
  return `<div class="wp-slot${bel?" bel":""}"><div><b>${TAGEL[s.d]}, ${esc(dm(addD(parse(S.woche),s.d)))} · ${esc(zeitBereich(s.h,s.len||1))}</b><small>${esc(s.lehrkraft||"Lehrkraft")} · ${esc(FACH(s.fach).l)}</small></div>
  ${mein?'<span class="pill">gebucht</span>':bel?'<span class="pill">vergeben</span>':!platz?'<span class="pill">bei dir belegt</span>':`<button class="primary" ${eigene>=2?"disabled":""} onclick="wp.buche('${s.id}')">Buchen</button>`}</div>`}).join(""):'<p class="wp-leer">Für diese Woche hat noch keine Lehrkraft Termine angeboten.</p>'}</div>
 <div class="form-actions"><button class="secondary" onclick="closeModal()">Schließen</button></div>`);
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
 modalOpen(`<div class="kicker">${isK?"KOMPETENZ ANFRAGEN":"TUTOR:IN BUCHEN"}</div><h2>${isK?"Wer kann dir im Projekt helfen?":"Wer erklärt dir etwas?"}</h2>
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
 modalOpen(`<div class="kicker">ANFRAGEN · ${esc(wochenText(w))}</div><h2>Anfragen an dich</h2>
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
 modalOpen(`<div class="kicker">MEIN ANGEBOT</div><h2>Anderen helfen</h2><p>Hier entscheidest du, wobei du Mitschüler:innen unterstützen möchtest. Dein Angebot sehen alle in der Klasse – mit deinem Pseudonym.</p>
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
  return modalOpen(`<div class="wp-artband" style="${artStyle(e.art==="lernstand"?"lernstand":"einfuehrung")}">${esc(tart(e).l)}</div><div class="kicker">${esc(FACH(e.fach).l)}</div><h2>${esc(e.titel)}</h2><p>${TAGEL[e.d]}, ${esc(zeitBereich(e.h,e.len||1))}${e.lehrkraft?" · "+esc(e.lehrkraft):""}${e.raum?" · Raum "+esc(e.raum):""}</p><p class="wp-hint">${tart(e).hint}</p>${anhHtml(e.anhaenge)}<div class="form-actions"><button class="secondary" onclick="closeModal()">Schließen</button></div>`)}
 if(kind==="termin"){const b=S.d.buch.find(x=>x.id===id);if(!b)return;
  return modalOpen(`<div class="kicker">MEIN TERMIN</div><h2>${esc(b.lehrkraft||"Lehrkraft")}</h2><p>${TAGEL[b.d]}, ${esc(zeitBereich(b.h,b.len||1))}</p><p><b>Meine Frage:</b> ${esc(b.frage)}</p><div class="form-actions"><button class="secondary" onclick="wp.terminAbsagen('${b.id}')">Termin absagen</button><button class="primary" onclick="closeModal()">Schließen</button></div>`)}
 if(kind==="tutor"){const a=[...S.d.anfV,...S.d.anfT].find(x=>x.id===id);if(!a)return;const ich=a.tutorUid===uid();
  return modalOpen(`<div class="kicker">${a.art==="kompetenz"?"KOMPETENZ":"TUTORING"} · ${a.status==="offen"?"ANGEFRAGT":"BESTÄTIGT"}</div><h2>${esc(ich?a.vonPseudo:a.tutorPseudo)}</h2><p>${TAGEL[a.d]}, ${esc(zeitBereich(a.h,a.len||1))}</p><p><b>Thema:</b> ${esc(a.thema)}${a.projekt?"<br><b>Projekt:</b> "+esc(a.projekt):""}</p><div class="form-actions"><button class="secondary" onclick="wp.zurueckziehen('${a.id}')">${ich?"Absagen":"Zurückziehen"}</button><button class="primary" onclick="closeModal()">Schließen</button></div>`)}
 const e=S.d.plan.eintraege.find(x=>x.id===id);if(!e)return;
 const m=e.moduleId?S.d.module.find(x=>x.id===e.moduleId):null;
 const ziel=e.route?`<button class="secondary" onclick="closeModal();go('${esc(e.route)}')">Öffnen</button>`:(e.link&&/^https:\/\//.test(e.link)?`<a class="secondary btn" href="${esc(e.link)}" target="_blank" rel="noopener">Link öffnen</a>`:"");
 const I=dauerInfo(e);
 modalOpen(`${e.mTyp?`<div class="wp-artband" style="${artStyle(e.mTyp)}">${esc(artOf(e.mTyp).l)}</div>`:""}<div class="kicker">${esc(FACH(e.fach).l)} · ${esc(dauerKurz(I))}</div><h2>${esc(e.titel)}</h2><p>${I.lang?esc(I.label):TAGEL[e.d]+", "+esc(zeitBereich(e.h,e.len||1))}</p>${m&&m.beschr?`<p>${esc(m.beschr)}</p>`:""}${anhHtml(m&&m.anhaenge)}
 <label class="form"><span>Notiz (nur für dich)</span><textarea id="wpNotiz" rows="2" maxlength="300" onchange="wp.notiz('${e.id}',this.value)">${esc(e.note||"")}</textarea></label>
 <div class="form-actions"><button class="secondary" onclick="wp.entfernen('${e.id}')">Aus Plan nehmen</button>${ziel}<button class="primary" onclick="wp.erledigt('${e.id}')">${e.erledigt?"Wieder öffnen":"✓ Erledigt"}</button></div>`);
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
const TABS=[["uebersicht","Klassenübersicht"],["module","Lernbausteine"],["plan","Einführungen, Gespräche & Termine"],["team","Klassenteam & Freitagsplanung"],["anfragen","Hilfe in der Klasse"]];
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
 else h+=await tabAnfragen();
 return h;
}
/* ---------- Übersicht ---------- */
async function tabUebersicht(){
 const w=S.woche;
 const [users,stat]=await Promise.all([qdocs("users",W("role","student")).catch(()=>[]),qdocs("wpStatus",W("woche",w)).catch(()=>[])]);
 const st=Object.fromEntries(stat.map(s=>[s.uid,s]));
 const sts=users.filter(u=>u.status==="approved").map(u=>({u,s:st[u.uid]||null})).sort((a,b)=>String(a.u.displayName).localeCompare(String(b.u.displayName),"de"));
 const mitPlan=sts.filter(x=>x.s&&x.s.modGeplant>0).length;
 const avg=sts.length?sts.reduce((s,x)=>s+(x.s?x.s.geplantMin:0),0)/sts.length:0;
 const badge=s=>{if(!s||!s.modGesamt)return !s?'<span class="pill rot">kein Plan</span>':'<span class="pill">keine Lernbausteine</span>';const r=s.modGeplant/s.modGesamt;return r>=.7?'<span class="pill ok">Plan steht</span>':r>0?'<span class="pill warn">Plan angefangen</span>':'<span class="pill rot">kein Plan</span>'};
 let h=`<div class="wp-kpis"><div class="card"><b>${sts.length}</b><small>freigeschaltete Schüler:innen</small></div><div class="card"><b>${mitPlan}</b><small>haben Lernbausteine eingeplant</small></div><div class="card"><b>${std(avg)}</b><small>Ø Lernzeit geplant</small></div><div class="card"><b>${sts.reduce((s,x)=>s+(x.s?x.s.checkouts:0),0)}</b><small>Check-outs erledigt</small></div></div>`;
 h+=`<div class="card"><div class="wp-th"><h3>Wer hat schon geplant?</h3><small>Nur Kennzahlen – der Plan selbst bleibt privat, außer die Person teilt ihn.</small></div>
 <div class="wp-tabelle"><div class="wp-tr wp-tk"><span>Pseudonym</span><span>Lernbausteine eingeplant</span><span>Lernzeit (geplant / erledigt)</span><span>Check-outs</span><span>Status</span><span></span></div>
 ${sts.map(({u,s})=>{const r=s&&s.modGesamt?Math.round(s.modGeplant/s.modGesamt*100):0;
  return `<div class="wp-tr"><span><b>${esc(fb.zkAnzeige(u))}</b></span><span><div class="wp-mini"><i style="width:${r}%"></i></div><small>${s?s.modGeplant+" / "+s.modGesamt:"–"}</small></span><span>${s?std(s.geplantMin)+" / "+std(s.erledigtMin):"–"}</span><span>${s?s.checkouts:"–"}</span><span>${badge(s)}</span><span>${s&&s.geteilt?`<button class="secondary" onclick="wp.planAnsehen('${u.uid}')">Plan ansehen</button>`:'<small>privat</small>'}</span></div>`}).join("")||'<p class="wp-leer">Noch keine Schüler:innen freigeschaltet.</p>'}</div></div>
 <div class="card"><h3>Impuls an alle</h3><p class="wp-hint">Erscheint oben im Wochenplan aller Schüler:innen dieser Woche.</p><textarea id="wpImpuls" rows="2" maxlength="300" placeholder="z. B. Plant bis Mittwoch mindestens zwei Lernzeiten ein.">${esc(S.d.wochenDoc?.impuls||"")}</textarea><div class="form-actions"><button class="primary" onclick="wp.impuls()">Impuls senden</button></div></div>
 <div class="card wp-ds"><b>Datenschutz:</b> Lehrkräfte sehen die Zahlen in dieser Übersicht (Anzahl eingeplanter Lernbausteine, Lernzeit, Check-outs). Auszeiten, Notizen, Wochenrückblicke und die Inhalte des Plans sind für euch nicht einsehbar – es sei denn, eine Schüler:in teilt ihren Plan ausdrücklich.</div>`;
 return h;
}
async function planAnsehen(u){
 const p=await gdoc("wpPlan",u+"_"+S.woche);if(!p||!p.geteilt)return fb.toast("Dieser Plan ist nicht geteilt.");
 modalOpen(`<div class="kicker">GETEILTER PLAN · ${esc(wochenText(S.woche))}</div><h2>Plan</h2>${p.ziel?`<p><b>Wochenziel:</b> ${esc(p.ziel)}</p>`:""}
 <div class="wp-liste">${(p.eintraege||[]).filter(e=>e.typ!=="auszeit").sort((a,b)=>a.d-b.d||a.h-b.h).map(e=>`<div><span class="wp-fl" style="--fc:${FACH(e.fach).c};--fb:${FACH(e.fach).bg}">${esc(FACH(e.fach).l)}</span><b>${esc(e.titel)}</b><small>${TAGE[e.d]} ${esc(zeitBereich(e.h,e.len||1))}${e.erledigt?" · ✓ erledigt":""}</small></div>`).join("")||'<p class="wp-leer">Noch nichts eingeplant.</p>'}</div>
 <div class="form-actions"><button class="primary" onclick="closeModal()">Schließen</button></div>`);
}
async function impuls(){
 const t=($("wpImpuls")?.value||"").trim();
 try{await fb.setDoc(ref("wpWochen",S.woche),{woche:S.woche,impuls:t.slice(0,300),status:"live",updatedAt:fb.serverTimestamp()},{merge:true});fb.toast("Impuls gesendet.");neu()}catch(e){console.error(e);fb.toast("Nicht möglich.")}
}
/* ---------- Module ---------- */
function tabModule(){
 const mods=S.d.module;
 const grp={};mods.forEach(m=>(grp[m.typ]=grp[m.typ]||[]).push(m));
 let h=`<div class="wp-actions2"><button class="primary" onclick="wp.modulForm()">＋ Neuer Lernbaustein</button><button class="secondary" onclick="wp.zeitenForm()">Stundenzeiten</button></div>${artLegende()}`;
 if(!mods.length)h+=`<div class="card"><p class="wp-leer">Für diese Woche gibt es noch keine Lernbausteine. Legt mit „Neuer Lernbaustein“ Check-outs, Einführungen, Projekte, Lernbausteine oder Kurse (z. B. Selbstlernkurs, Fachaufsatz-Training) an. Lernstandsgespräche setzt ihr als feste Termine im Reiter „Einführungen, Gespräche & Termine“.</p></div>`;
 [...ART_REIHE,...Object.keys(grp).filter(k=>!ART_REIHE.includes(k))].filter(k=>grp[k]).forEach(k=>{const a=artOf(k);
  h+=`<div class="card wp-artcard" style="${artStyle(k)}"><h3><span class="wp-art" style="${artStyle(k)}">${esc(MTYP[k]?.l||a.l)}</span> <small>${grp[k].length}</small></h3><div class="wp-liste">${grp[k].map(m=>{const f=FACH(m.fach);return `<div><span class="wp-fl" style="--fc:${f.c};--fb:${f.bg}">${esc(f.l)}</span><b>${esc(m.titel)}</b><small>${esc(dauerInfo(m).label)}${m.pflicht?" · Pflicht":""}${m.woche===""?" · jede Woche":""}${(m.anhaenge||[]).length?" · "+m.anhaenge.length+" Anhang":""}</small>
  <span class="pill ${m.status==="live"?"ok":"warn"}">${m.status==="live"?"live":"Entwurf"}</span>
  <span class="wp-rowact"><button class="secondary" onclick="wp.modulForm('${m.id}')">Bearbeiten</button><button class="secondary" onclick="wp.modulKopie('${m.id}')" title="als Entwurf in die nächste Woche kopieren">→ Nächste Woche</button><button class="secondary" onclick="wp.modulWeg('${m.id}')">Löschen</button></span></div>`}).join("")}</div></div>`});
 return h;
}
function wochenOptionen(sel){
 const a=parse(S.woche);return [[S.woche,"Diese Woche ("+wochenText(S.woche).split(" · ")[0]+")"],[iso(addD(a,7)),"Nächste Woche"],["","Jede Woche verfügbar"]].map(o=>`<option value="${o[0]}" ${o[0]===sel?"selected":""}>${o[1]}</option>`).join("")
}
function modulForm(id){
 const m=id?S.d.module.find(x=>x.id===id):{titel:"",fach:"deutsch",typ:"lernen",len:1,woche:S.woche,beschr:"",route:"",link:"",pflicht:false,mehrfach:false,status:"entwurf"};
 S.anh=[...(m.anhaenge||[])];
 modalOpen(`<div id="mfWrap" class="wp-artform" style="${artStyle(m.typ)}"><div id="mfBand" class="wp-artband" style="${artStyle(m.typ)}">${esc(artOf(m.typ).l)}</div><div class="kicker">LERNBAUSTEIN</div><h2>${id?"Lernbaustein bearbeiten":"Neuer Lernbaustein"}</h2><div class="form">
 <label>Titel<input id="mfTitel" maxlength="80" value="${esc(m.titel)}"></label>
 <label>Fach<select id="mfFach">${FAECHER.map(f=>`<option value="${f.k}" ${f.k===m.fach?"selected":""}>${esc(f.l)}</option>`).join("")}</select></label>
 <label>Art<select id="mfTyp" onchange="wp.artVorschau(this.value)">${Object.keys(MTYP).map(k=>`<option value="${k}" ${k===m.typ?"selected":""}>${MTYP[k].l}</option>`).join("")}</select></label>
 <label>Dauer<select id="mfLen">${DAUER_OPT.map(o=>`<option value="${o[0]}" ${o[0]===(dauerInfo(m).code||String(dauerInfo(m).min))?"selected":""}>${o[1]}</option>`).join("")}</select></label>
 <label>Gilt für<select id="mfWoche">${wochenOptionen(m.woche)}</select></label>
 <label>Beschreibung<textarea id="mfBeschr" rows="3" maxlength="400">${esc(m.beschr||"")}</textarea></label>
 ${anhForm()}
 <label>Verknüpfte Seite in der App<select id="mfRoute">${ROUTEN.map(r=>`<option value="${r[0]}" ${r[0]===(m.route||"")?"selected":""}>${r[1]}</option>`).join("")}</select></label>
 <label>oder Link (https://…)<input id="mfLink" maxlength="300" value="${esc(m.link||"")}"></label>
 <label class="check"><input type="checkbox" id="mfPflicht" ${m.pflicht?"checked":""}><span>Pflicht-Lernbaustein</span></label>
 <label class="check"><input type="checkbox" id="mfMehr" ${m.mehrfach?"checked":""}><span>Kann mehrfach eingeplant werden</span></label>
 <label>Status<select id="mfStatus"><option value="entwurf" ${m.status!=="live"?"selected":""}>Entwurf (nur Lehrkräfte)</option><option value="live" ${m.status==="live"?"selected":""}>Live (Schüler:innen sehen es)</option></select></label>
 <div class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button><button class="primary" onclick="wp.modulSave('${id||""}')">Speichern</button></div></div></div>`);
}
async function modulSave(id){
 const titel=$("mfTitel").value.trim();if(titel.length<2)return fb.toast("Bitte einen Titel eingeben.");
 const link=$("mfLink").value.trim();if(link&&!/^https:\/\//.test(link))return fb.toast("Der Link muss mit https:// beginnen.");
 const d={titel,fach:$("mfFach").value,typ:$("mfTyp").value,dauer:dauerInfo({dauer:$("mfLen").value}).code,len:dauerInfo({dauer:$("mfLen").value}).len,anhaenge:S.anh||[],woche:$("mfWoche").value,beschr:$("mfBeschr").value.trim(),route:$("mfRoute").value,link,pflicht:$("mfPflicht").checked,mehrfach:$("mfMehr").checked,status:$("mfStatus").value,updatedAt:fb.serverTimestamp()};
 try{if(id)await fb.updateDoc(ref("wpModule",id),d);else await fb.addDoc(col("wpModule"),{...d,createdBy:uid(),createdAt:fb.serverTimestamp()});fb.closeModal();fb.toast("Gespeichert.");neu()}catch(e){console.error(e);fb.toast("Speichern nicht möglich.")}
}
async function modulWeg(id){if(!confirm("Diesen Lernbaustein löschen? Bereits eingeplante Einträge der Schüler:innen bleiben bestehen."))return;try{await fb.deleteDoc(ref("wpModule",id));neu()}catch(e){fb.toast("Nicht möglich.")}}
async function modulKopie(id){
 const m=S.d.module.find(x=>x.id===id);if(!m)return;const {id:_i,...rest}=m;
 try{await fb.addDoc(col("wpModule"),{...rest,woche:iso(addD(parse(S.woche),7)),status:"entwurf",createdBy:uid(),createdAt:fb.serverTimestamp(),updatedAt:fb.serverTimestamp()});fb.toast("Als Entwurf in die nächste Woche kopiert.")}catch(e){console.error(e);fb.toast("Nicht möglich.")}
}
function zeitenForm(){
 modalOpen(`<div class="kicker">EINSTELLUNGEN</div><h2>Stundenzeiten</h2><p>Beginn der 10 Stunden (45 Minuten). Gilt für die ganze Klasse.</p><div class="wp-zeitenraster">${zeiten().map((z,i)=>`<label>${i+1}.<input id="zt${i}" type="time" value="${esc(z)}"></label>`).join("")}</div>
 <div class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button><button class="primary" onclick="wp.zeitenSave()">Speichern</button></div>`);
}
async function zeitenSave(){
 const l=[...Array(10)].map((_,i)=>$("zt"+i).value);if(l.some(x=>!/^\d\d:\d\d$/.test(x)))return fb.toast("Bitte alle Zeiten ausfüllen.");
 try{await fb.setDoc(ref("wpEinstellungen","zeiten"),{liste:l,updatedAt:fb.serverTimestamp()});S.zeiten=l;fb.closeModal();neu()}catch(e){fb.toast("Nicht möglich.")}
}
/* ---------- Einführungen & Termine ---------- */
async function tabPlan(){
 const bu=await qdocs("wpBuchungen",W("woche",S.woche)).catch(()=>[]);S.d.buchungen=Object.fromEntries(bu.map(b=>[b.id,b]));
 let h=`<div class="card"><p class="wp-hint">Tippt auf einen freien Platz, um eine <b>Einführung</b> (feste Stunde eines Fachs), ein <b>Lernstandsgespräch</b> (fester Termin, den ihr setzt) oder eine <b>Sprechzeit</b> (buchbarer Termin für fachliche Fragen) anzulegen. Entwürfe sind gestrichelt und für Schüler:innen unsichtbar.</p></div>`;
 h+=tageTabs()+rasterHtml({teacher:true});
 const sl=[...S.d.slots].sort((a,b)=>a.d-b.d||a.h-b.h);
 h+=`<div class="card"><h3>Sprechzeiten dieser Woche</h3>${sl.length?`<div class="wp-liste">${sl.map(s=>{const b=S.d.buchungen[s.id];
  return `<div><span></span><b>${TAGE[s.d]} ${esc(zeitBereich(s.h,s.len||1))} · ${esc(s.lehrkraft||"")}</b><small>${esc(FACH(s.fach).l)}</small>${b?`<span class="wp-gebucht"><b>${esc(b.pseudo)}</b>: ${esc(b.frage)}</span>`:`<span class="pill">frei</span>`}<span class="pill ${s.status==="live"?"ok":"warn"}">${s.status==="live"?"live":"Entwurf"}</span><span class="wp-rowact"><button class="secondary" onclick="wp.slotBearbeiten('${s.id}')">Bearbeiten</button></span></div>`}).join("")}</div>`:'<p class="wp-leer">Noch keine Sprechzeiten.</p>'}</div>`;
 return h;
}
function teacherZelle(d,h){
 if(S.tab!=="plan")return;
 if(!frei(d,h,1))return;
 modalOpen(`<div class="kicker">${TAGEL[d]} · ${h}. Stunde</div><h2>Was soll hier stehen?</h2><div class="wp-wahl"><button class="primary" onclick="wp.einfForm(null,${d},${h},'einfuehrung')">Einführung (fester Termin)</button><button class="primary" onclick="wp.einfForm(null,${d},${h},'lernstand')">Lernstandsgespräch (fester Termin)</button><button class="secondary" onclick="wp.slotForm(null,${d},${h})">Sprechzeit (buchbar)</button></div><div class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button></div>`);
}
function einfForm(id,d,h,art){
 const e=id?S.d.einf.find(x=>x.id===id):{fach:"deutsch",titel:art==="lernstand"?"Lernstandsgespräch":"",art:art==="lernstand"?"lernstand":"einfuehrung",d,h,len:1,lehrkraft:fb.profile?.displayName||"",raum:"",status:"entwurf"};
 const T=tart(e);
 S.anh=[...(e.anhaenge||[])];
 modalOpen(`<div class="wp-artform" style="${artStyle(e.art==="lernstand"?"lernstand":"einfuehrung")}"><div class="wp-artband" style="${artStyle(e.art==="lernstand"?"lernstand":"einfuehrung")}">${esc(T.l)}</div><div class="kicker">${T.kick}</div><h2>${id?T.edit:T.neu}</h2><div class="form">
 <label>Fach<select id="efFach">${FAECHER.map(f=>`<option value="${f.k}" ${f.k===e.fach?"selected":""}>${esc(f.l)}</option>`).join("")}</select></label>
 <label>${e.art==="lernstand"?"Titel":"Thema / Titel"}<input id="efTitel" maxlength="80" value="${esc(e.titel)}" placeholder="${esc(T.ph)}"></label>
 <label>Tag<select id="efD">${TAGEL.map((t,i)=>`<option value="${i}" ${i===e.d?"selected":""}>${t}</option>`).join("")}</select></label>
 <label>Beginn (Stunde)<select id="efH">${[...Array(10)].map((_,i)=>`<option value="${i+1}" ${i+1===e.h?"selected":""}>${i+1}. Stunde (${esc(zeiten()[i])})</option>`).join("")}</select></label>
 <label>Dauer<select id="efLen"><option value="1" ${e.len!==2?"selected":""}>45 Minuten</option><option value="2" ${e.len===2?"selected":""}>90 Minuten</option></select></label>
 ${anhForm()}
 <label>Lehrkraft<input id="efLk" maxlength="60" value="${esc(e.lehrkraft||"")}"></label><label>Raum (optional)<input id="efRaum" maxlength="20" value="${esc(e.raum||"")}"></label>
 <label>Status<select id="efStatus"><option value="entwurf" ${e.status!=="live"?"selected":""}>Entwurf</option><option value="live" ${e.status==="live"?"selected":""}>Live</option></select></label>
 <div class="form-actions">${id?`<button class="secondary" onclick="wp.einfWeg('${id}')">Löschen</button>`:""}<button class="secondary" onclick="closeModal()">Abbrechen</button><button class="primary" onclick="wp.einfSave('${id||""}','${e.art||"einfuehrung"}')">Speichern</button></div></div></div>`);
}
async function einfSave(id,art){
 const d=Number($("efD").value),h=Number($("efH").value),len=Number($("efLen").value)||1,titel=$("efTitel").value.trim();
 if(titel.length<2)return fb.toast(art==="lernstand"?"Bitte einen Titel eingeben.":"Bitte ein Thema eingeben.");
 if(!frei(d,h,len,id))return fb.toast("Zu dieser Zeit ist schon etwas eingetragen (oder die Stunde reicht über den Tag hinaus).");
 const data={woche:S.woche,d,h,len,art:art==="lernstand"?"lernstand":"einfuehrung",fach:$("efFach").value,titel,lehrkraft:$("efLk").value.trim(),raum:$("efRaum").value.trim(),anhaenge:S.anh||[],status:$("efStatus").value,updatedAt:fb.serverTimestamp()};
 try{if(id)await fb.updateDoc(ref("wpEinfuehrungen",id),data);else await fb.addDoc(col("wpEinfuehrungen"),{...data,createdBy:uid(),createdAt:fb.serverTimestamp()});fb.closeModal();neu()}catch(e){console.error(e);fb.toast("Speichern nicht möglich.")}
}
async function einfWeg(id){if(!confirm(tart(S.d.einf.find(x=>x.id===id)).weg))return;try{await fb.deleteDoc(ref("wpEinfuehrungen",id));fb.closeModal();neu()}catch(e){fb.toast("Nicht möglich.")}}
function slotForm(id,d,h){
 const s=id?S.d.slots.find(x=>x.id===id):{fach:"deutsch",d,h,len:1,lehrkraft:fb.profile?.displayName||"",status:"entwurf"};
 modalOpen(`<div class="kicker">SPRECHZEIT</div><h2>${id?"Sprechzeit bearbeiten":"Neue Sprechzeit"}</h2><p class="wp-hint">Schüler:innen können diesen Termin für eine fachliche Frage buchen (ein Platz).</p><div class="form">
 <label>Lehrkraft<input id="slLk" maxlength="60" value="${esc(s.lehrkraft||"")}"></label>
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
 const data={woche:S.woche,d,h,len,fach:$("slFach").value,lehrkraft:$("slLk").value.trim(),lehrkraftUid:uid(),status:$("slStatus").value,updatedAt:fb.serverTimestamp()};
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
   Öffentliche Schnittstelle
   ========================================================= */
Object.assign(wpPublic,{
 ltab:t=>{S.tab=t;neu()},
 anhHoch,anhWeg,artVorschau,anwKlick,anwAlle,anwPlanung,foldMerk:(id,o)=>{S.fold=S.fold||{};S.fold[id]=o},planAnsehen,impuls,modulForm,modulSave,modulWeg,modulKopie,zeitenForm,zeitenSave,
 einfForm,einfBearbeiten:id=>einfForm(id),einfSave,einfWeg,slotForm,slotBearbeiten:id=>slotForm(id),slotSave,slotWeg,
 chatSenden,teamNotiz,todoNeu,todoToggle,todoWeg,freigeben,vorwoche,angebotMod
});
window.wp=wpPublic;

export async function wpRender(){
 S.armed=null;
 return `<div id="wpRoot" class="wp">${await inhalt()}</div>`;
}
