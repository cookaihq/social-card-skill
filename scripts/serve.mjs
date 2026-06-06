import { createServer as createHttpServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';

// Why a real HTTP server instead of opening file://:
// the gallery (and the skill's editorial template) load ES modules and a WebGL
// canvas, which browsers block under the file:// origin. http://localhost also
// gives the user a single clickable link instead of a long file path.

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

export function contentType(filePath) {
  return MIME[extname(filePath).toLowerCase()] || 'application/octet-stream';
}

// Map a request URL onto a file inside rootDir, refusing anything that escapes
// rootDir (e.g. `/../../etc/passwd`). Returns the absolute path, or null if the
// resolved path would leave the served root. A trailing-slash / bare path maps
// to index.html so directory requests render the gallery.
export function safeResolve(rootDir, urlPath) {
  const root = resolve(rootDir);
  let pathname;
  try {
    pathname = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  } catch {
    return null; // malformed percent-encoding
  }
  if (pathname.endsWith('/') || pathname === '') pathname = pathname + 'index.html';
  const target = normalize(join(root, pathname));
  if (target !== root && !target.startsWith(root + sep)) return null;
  return target;
}

export function createServer(rootDir) {
  return createHttpServer(async (req, res) => {
    let filePath = safeResolve(rootDir, req.url || '/');
    if (filePath === null) {
      res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('403 Forbidden');
      return;
    }
    try {
      let info = await stat(filePath);
      if (info.isDirectory()) {
        filePath = join(filePath, 'index.html');
        info = await stat(filePath);
      }
      const body = await readFile(filePath);
      res.writeHead(200, {
        'content-type': contentType(filePath),
        'content-length': info.size ?? body.length,
        'cache-control': 'no-cache',
      });
      res.end(body);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
    }
  });
}

// Start listening, hunting for a free port from `port` upward (some other
// process may already hold the default). Resolves once bound.
export function serve(rootDir, { port = 8137, host = '127.0.0.1', maxTries = 20 } = {}) {
  return new Promise((resolvePromise, rejectPromise) => {
    const server = createServer(rootDir);
    let attempt = 0;
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE' && attempt < maxTries) {
        attempt += 1;
        setTimeout(() => server.listen(port + attempt, host), 0);
      } else {
        rejectPromise(err);
      }
    });
    server.on('listening', () => {
      const bound = server.address().port;
      resolvePromise({ server, port: bound, url: `http://localhost:${bound}/` });
    });
    server.listen(port, host);
  });
}

// CLI: node scripts/serve.mjs <dir> [port]
// Stays up (the open socket keeps the event loop alive) until Ctrl-C / SIGTERM.
if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = process.argv[2];
  if (!dir) {
    console.error('usage: node scripts/serve.mjs <dir> [port]');
    process.exit(1);
  }
  const port = process.argv[3] ? Number(process.argv[3]) : 8137;
  serve(dir, { port })
    .then(({ server, url }) => {
      console.log(url);
      const shutdown = () => server.close(() => process.exit(0));
      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
    })
    .catch((err) => {
      console.error(`serve failed: ${err.message}`);
      process.exit(1);
    });
}
