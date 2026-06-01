import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pngDimensions, classify, buildHtml, buildOverview } from './build-overview.mjs';

// Minimal PNG: 8-byte signature + IHDR with width/height at offsets 16/20.
function fakePng(width, height) {
  const buf = Buffer.alloc(24);
  buf.write('\x89PNG\r\n\x1a\n', 0, 'latin1');
  buf.writeUInt32BE(width, 16);
  buf.writeUInt32BE(height, 20);
  return buf;
}

test('pngDimensions reads IHDR width/height', () => {
  assert.deepEqual(pngDimensions(fakePng(1080, 1440)), { width: 1080, height: 1440 });
});

test('pngDimensions rejects a non-PNG buffer', () => {
  assert.throws(() => pngDimensions(Buffer.from('not a png at all....')));
});

test('pngDimensions rejects a long buffer with a wrong signature', () => {
  // ≥24 bytes so the length guard passes; bad signature must still throw.
  const buf = Buffer.alloc(24, 0x41); // all 'A' — valid length, wrong signature
  assert.throws(() => pngDimensions(buf), /bad signature/);
});

test('classify maps filename prefixes to groups', () => {
  assert.equal(classify('xhs-01-cover.png'), 'xiaohongshu');
  assert.equal(classify('wechat-21x9-cover.png'), 'wechat');
  assert.equal(classify('wechat-1x1-cover.png'), 'wechat');
  assert.equal(classify('wechat-cover-pair-preview.png'), 'wechat');
  assert.equal(classify('mystery.png'), 'other');
});

test('buildHtml renders a group section with img path + dimensions', () => {
  const html = buildHtml([
    { file: 'xhs-01-cover.png', group: 'xiaohongshu', width: 1080, height: 1440 },
  ]);
  assert.match(html, /小红书组图/);
  assert.match(html, /assets\/xhs-01-cover\.png/);
  assert.match(html, /1080×1440/);
  assert.match(html, /共 1 张/);
});

test('buildHtml omits groups that have no items', () => {
  const html = buildHtml([
    { file: 'xhs-01.png', group: 'xiaohongshu', width: 1, height: 1 },
  ]);
  assert.doesNotMatch(html, /公众号封面对/);
});

test('buildHtml escapes filenames', () => {
  const html = buildHtml([
    { file: 'a&b<x>.png', group: 'other', width: 10, height: 10 },
  ]);
  assert.match(html, /a&amp;b&lt;x&gt;\.png/);
});

test('buildOverview copies PNGs into assets/ and writes a grouped index.html', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sc-overview-'));
  mkdirSync(join(dir, 'output'));
  writeFileSync(join(dir, 'output', 'xhs-01-cover.png'), fakePng(1080, 1440));
  writeFileSync(join(dir, 'output', 'wechat-21x9-cover.png'), fakePng(2100, 900));

  const indexPath = buildOverview(dir);

  assert.ok(existsSync(indexPath), 'index.html exists');
  assert.ok(existsSync(join(dir, 'overview', 'assets', 'xhs-01-cover.png')), 'png copied');
  const html = readFileSync(indexPath, 'utf8');
  assert.match(html, /小红书组图/);
  assert.match(html, /公众号封面对/);
  assert.match(html, /共 2 张/);
});

test('buildOverview throws when there is no output dir', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sc-overview-empty-'));
  assert.throws(() => buildOverview(dir), /no output dir/);
});

test('buildOverview throws when output dir exists but has no PNGs', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sc-overview-nopng-'));
  mkdirSync(join(dir, 'output'));
  assert.throws(() => buildOverview(dir), /no PNGs/);
});

test('buildOverview includes the filename when a PNG fails to parse', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sc-overview-bad-'));
  mkdirSync(join(dir, 'output'));
  writeFileSync(join(dir, 'output', 'xhs-01-cover.png'), fakePng(1080, 1440));
  writeFileSync(join(dir, 'output', 'broken.png'), Buffer.from('not a png at all....'));
  assert.throws(() => buildOverview(dir), /broken\.png/);
});
