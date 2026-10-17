/* Service Worker: macht wiederholte Starts schnell (Dateien kommen vom Gerät statt aus dem Netz).
   - Firebase/Google-Anfragen (andere Adresse) werden NICHT angefasst.
   - index.html: erst Netz (max. 5 s), sonst gespeicherte Fassung -> Updates kommen automatisch an.
   - Dateien mit Versionsnummer (?v=20261017a): einmal laden, danach vom Gerät. Neue Version = neue Adresse.
   - Bilder/Symbole: sofort vom Gerät, im Hintergrund aktualisiert.
   - Alles andere (Daten-JSON mit Zeitstempel, PDFs, Konfiguration): normal übers Netz. */
const APP=new URL(self.registration.scope).pathname.replace(/\W+/g,"_");
const CACHE="campus"+APP+"v1";

self.addEventListener("install",()=>{self.skipWaiting()});
self.addEventListener("activate",e=>{
  e.waitUntil((async()=>{
    for(const k of await caches.keys()){
      if(k.startsWith("campus"+APP)&&k!==CACHE)await caches.delete(k);
    }
    await self.clients.claim();
  })());
});

async function aufraeumen(cache,url){
  /* alte Versionen derselben Datei entfernen */
  const u=new URL(url);
  for(const r of await cache.keys()){
    const x=new URL(r.url);
    if(x.pathname===u.pathname&&x.search!==u.search)await cache.delete(r);
  }
}
async function netzDannCache(req){
  const cache=await caches.open(CACHE);
  try{
    const antwort=await Promise.race([
      fetch(req),
      new Promise((_,nein)=>setTimeout(()=>nein(new Error("timeout")),5000))
    ]);
    if(antwort&&antwort.ok)cache.put(req,antwort.clone());
    return antwort;
  }catch(e){
    const alt=await cache.match(req,{ignoreSearch:true});
    if(alt)return alt;
    return fetch(req);
  }
}
async function cacheZuerst(req){
  const cache=await caches.open(CACHE);
  const treffer=await cache.match(req);
  if(treffer)return treffer;
  const antwort=await fetch(req);
  if(antwort&&antwort.ok){await cache.put(req,antwort.clone());aufraeumen(cache,req.url)}
  return antwort;
}
async function sofortUndAktualisieren(req){
  const cache=await caches.open(CACHE);
  const treffer=await cache.match(req);
  const netz=fetch(req).then(a=>{if(a&&a.ok)cache.put(req,a.clone());return a}).catch(()=>null);
  return treffer||(await netz)||Response.error();
}

self.addEventListener("fetch",e=>{
  const req=e.request;
  if(req.method!=="GET")return;
  const u=new URL(req.url);
  if(u.origin!==location.origin)return;
  if(u.pathname.endsWith("/sw.js"))return;
  const v=u.searchParams.get("v")||"";
  const istSeite=req.mode==="navigate"||u.pathname.endsWith("/")||u.pathname.endsWith("/index.html");
  if(istSeite){e.respondWith(netzDannCache(req));return}
  if(/^\d{8}[a-z]?$/.test(v)){e.respondWith(cacheZuerst(req));return}
  if(/\.(png|jpe?g|svg|ico|webp|woff2?)$/i.test(u.pathname)){e.respondWith(sofortUndAktualisieren(req));return}
});
