const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, 'dist');
const port = Number(process.argv[2] || 4177);
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.txt':'text/plain; charset=utf-8', '.exe':'application/octet-stream', '.zip':'application/zip' };
const server = http.createServer((request, response) => {
  if (!['GET','HEAD'].includes(request.method)) { response.writeHead(405).end(); return; }
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
  catch { response.writeHead(400).end(); return; }
  const target = path.resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
  if (!target.toLowerCase().startsWith((root + path.sep).toLowerCase())) { response.writeHead(403).end(); return; }
  fs.readFile(target, (error, data) => {
    if (error) { response.writeHead(404).end('Not found'); return; }
    const ext = path.extname(target);
    const headers = { 'Content-Type': types[ext] || 'application/octet-stream', 'Content-Length':data.length, 'Cache-Control':'no-cache' };
    if (ext === '.exe' || ext === '.zip') headers['Content-Disposition'] = `attachment; filename="${path.basename(target)}"`;
    response.writeHead(200, headers);
    response.end(request.method === 'HEAD' ? undefined : data);
  });
});
server.listen(port, '127.0.0.1', () => process.stdout.write(`Local: http://127.0.0.1:${port}\n`));
process.stdin.setEncoding('utf8');
process.stdin.on('data', (value) => { if (value.trim() === 'quit') server.close(() => process.exit(0)); });
process.on('SIGINT', () => server.close(() => process.exit(0)));
