import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pngDimensions, classify, buildHtml } from './build-overview.mjs';

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
