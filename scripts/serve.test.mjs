import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { contentType, safeResolve, serve } from './serve.mjs';

test('contentType maps known extensions and falls back to octet-stream', () => {
  assert.equal(contentType('index.html'), 'text/html; charset=utf-8');
  assert.equal(contentType('app.MJS'), 'text/javascript; charset=utf-8');
  assert.equal(contentType('hero.PNG'), 'image/png');
  assert.equal(contentType('font.woff2'), 'font/woff2');
  assert.equal(contentType('mystery.bin'), 'application/octet-stream');
  assert.equal(contentType('noext'), 'application/octet-stream');
});

test('safeResolve maps a trailing slash and bare root to index.html', () => {
  const root = '/srv/gallery';
  assert.equal(safeResolve(root, '/'), resolve(root, 'index.html'));
  assert.equal(safeResolve(root, ''), resolve(root, 'index.html'));
  assert.equal(safeResolve(root, '/sub/'), resolve(root, 'sub', 'index.html'));
});

test('safeResolve resolves files inside the root', () => {
  const root = '/srv/gallery';
  assert.equal(safeResolve(root, '/style.css'), resolve(root, 'style.css'));
  assert.equal(safeResolve(root, '/a/b.png'), resolve(root, 'a', 'b.png'));
});

test('safeResolve strips query and hash', () => {
  const root = '/srv/gallery';
  assert.equal(safeResolve(root, '/style.css?v=2#x'), resolve(root, 'style.css'));
});

test('safeResolve refuses path traversal out of the root', () => {
  const root = '/srv/gallery';
  assert.equal(safeResolve(root, '/../../etc/passwd'), null);
  assert.equal(safeResolve(root, '/%2e%2e/%2e%2e/etc/passwd'), null);
  // A sibling dir that shares the root's name prefix must not be reachable.
  assert.equal(safeResolve(root, '/../gallery-secret/x'), null);
});

test('safeResolve returns null on malformed percent-encoding', () => {
  assert.equal(safeResolve('/srv/gallery', '/%E0%A4%A'), null);
});

test('serve binds a port and serves index.html for the root request', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'sc-serve-'));
  writeFileSync(join(dir, 'index.html'), '<!doctype html><title>ok</title>hello gallery');
  // port 0 lets the OS pick any free port — avoids clashing with a real run.
  const { server, url, port } = await serve(dir, { port: 0 });
  try {
    assert.ok(port > 0, 'bound to a real port');
    const res = await fetch(url);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /text\/html/);
    assert.match(await res.text(), /hello gallery/);
  } finally {
    server.close();
  }
});

test('serve returns 404 for a missing file', async () => {
  // Note: a `..` traversal cannot be tested through fetch/URL — the WHATWG URL
  // parser collapses dot-segments (including %2e%2e) before the request is sent,
  // so the server never sees them. The traversal guard itself is covered by the
  // safeResolve unit tests above; here we just confirm the 404 wiring.
  const dir = mkdtempSync(join(tmpdir(), 'sc-serve-'));
  writeFileSync(join(dir, 'index.html'), 'root');
  const { server, url } = await serve(dir, { port: 0 });
  try {
    const missing = await fetch(new URL('/nope.css', url));
    assert.equal(missing.status, 404);
  } finally {
    server.close();
  }
});
