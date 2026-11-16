// Tiny static server for the test rig and for looking at the site locally: node serve.js [port]
const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon','.md':'text/markdown; charset=utf-8','.woff2':'font/woff2','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.webmanifest':'application/manifest+json'};
function serve(port=0){return new Promise(res=>{const s=http.createServer((req,rsp)=>{let p=decodeURIComponent(new URL(req.url,'http://x').pathname);if(p.endsWith('/'))p+='index.html';const f=path.join(ROOT,p);
  if(!f.startsWith(ROOT)){rsp.writeHead(403);return rsp.end();}
  fs.readFile(f,(e,b)=>{if(e){rsp.writeHead(404,{'content-type':'text/plain'});return rsp.end('not found');}rsp.writeHead(200,{'content-type':TYPES[path.extname(f).toLowerCase()]||'application/octet-stream','cache-control':'no-store'});rsp.end(b);});});
 s.listen(port,'127.0.0.1',()=>res(s));});}
module.exports={serve};
if(require.main===module){const port=+process.argv[2]||8820;serve(port).then(()=>console.log(`Retro Arcade on http://localhost:${port}/`));}
