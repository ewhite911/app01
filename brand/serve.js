// Static server with the cross-origin isolation headers wa-sqlite needs for
// SharedArrayBuffer, plus an SPA fallback to index.html.
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.argv[2];
const TYPES = {'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png',
  '.jpg':'image/jpeg','.wasm':'application/wasm','.css':'text/css','.ttf':'font/ttf','.map':'application/json'};
http.createServer((req,res)=>{
  let p = decodeURIComponent(req.url.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(ROOT,'index.html');
  const body = fs.readFileSync(f);
  res.writeHead(200, {
    'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Resource-Policy': 'cross-origin',
  });
  res.end(body);
}).listen(8099, ()=>console.log('serving', ROOT, 'on 8099'));
