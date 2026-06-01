import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pngDimensions, classify } from './build-overview.mjs';

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
