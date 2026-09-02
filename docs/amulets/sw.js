self.addEventListener('install',function(e){self.skipWaiting()});
self.addEventListener('activate',function(e){e.waitUntil(self.clients.claim())});
self.addEventListener('fetch',function(e){
  var u=new URL(e.request.url);
  if(e.request.method==='POST'&&u.pathname.endsWith('/identify/share')){
    e.respondWith((async function(){
      try{var fd=await e.request.formData();var f=fd.get('photo');
        if(f){var c=await caches.open('shared-photo');await c.put('/identify/shared-photo',new Response(f,{headers:{'Content-Type':f.type||'image/jpeg'}}))}
      }catch(err){}
      return Response.redirect(u.pathname.replace(/share$/,'index.html?shared=1'),303);
    })());
  }
});
