var CACHE='amulet-identify-202609072326';
var ASSETS=['./identify/index.html','./identify/bank.json','./vendor/searchcore.js','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(ASSETS).catch(function(){})}).then(function(){return self.skipWaiting()}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k.indexOf('amulet-identify-')===0&&k!==CACHE}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(e){
  var u=new URL(e.request.url);
  if(e.request.method==='POST'&&u.pathname.endsWith('/identify/share')){
    e.respondWith((async function(){
      try{var fd=await e.request.formData();var files=fd.getAll('photo');var c=await caches.open('shared-photo');var i=0;
        for(var f of files){if(f&&f.size){await c.put('/identify/shared-'+Date.now()+'-'+(i++),new Response(f,{headers:{'Content-Type':f.type||'image/jpeg'}}))}}
      }catch(err){}
      return Response.redirect(u.pathname.replace(/share$/,'index.html?shared=1'),303);
    })());
    return;
  }
  if(e.request.method!=='GET')return;
  var p=u.pathname;
  if(p.indexOf('/identify/')>=0||p.endsWith('/vendor/searchcore.js')||p.endsWith('/manifest.webmanifest')||p.endsWith('/icon.svg')){
    // network first, cache fallback: fresh when online, working when not
    e.respondWith(fetch(e.request).then(function(r){var cp=r.clone();caches.open(CACHE).then(function(c){c.put(e.request,cp)});return r}).catch(function(){return caches.match(e.request)}));
  }
});
