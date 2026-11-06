// Static server that mimics Netlify: unknown paths get /404.html with status 404,
// `_headers` rules are applied, and everything else revalidates (Netlify's default).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const PORT = Number(process.env.PORT || 8000);
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.txt': 'text/plain', '.xml': 'application/xml' };
const DEFAULT_CACHE = 'public,max-age=0,must-revalidate';

// Parse the Netlify `_headers` file: an unindented path pattern (`*` is a wildcard)
// followed by indented `Name: value` lines.
function headerRules() {
  const file = path.join(ROOT, '_headers');
  if (!fs.existsSync(file)) return [];
  const rules = [];
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      rules.push({ pattern: line.trim(), headers: {} });
    } else if (rules.length) {
      const i = line.indexOf(':');
      rules[rules.length - 1].headers[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim();
    }
  }
  return rules.map((r) => ({
    re: new RegExp('^' + r.pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$'),
    headers: r.headers,
  }));
}

http.createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let p = urlPath;
  if (p.endsWith('/')) p += 'index.html';
  let file = path.join(ROOT, p);
  let status = 200;
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    file = path.join(ROOT, '404.html');
    status = 404;
  }
  const headers = {
    'content-type': TYPES[path.extname(file)] || 'application/octet-stream',
    'cache-control': DEFAULT_CACHE,
  };
  if (status === 200) {
    for (const rule of headerRules()) if (rule.re.test(urlPath)) Object.assign(headers, rule.headers);
  }
  res.writeHead(status, headers);
  fs.createReadStream(file).pipe(res);
}).listen(PORT, '127.0.0.1', () => console.log(`http://127.0.0.1:${PORT}`));
