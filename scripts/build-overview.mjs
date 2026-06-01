import { basename } from 'node:path';

// Read PNG intrinsic size from the IHDR chunk — no image library needed.
// PNG = 8-byte signature, then IHDR length(4)+type(4); width/height are the
// next two big-endian uint32s, at byte offsets 16 and 20.
export function pngDimensions(buf) {
  if (buf.length < 24) throw new Error('not a PNG: too short');
  if (buf.subarray(0, 8).toString('latin1') !== '\x89PNG\r\n\x1a\n') {
    throw new Error('not a PNG: bad signature');
  }
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

// Group key from filename prefix (see render naming in production-workflow.md).
export function classify(filename) {
  const n = basename(filename).toLowerCase();
  if (n.startsWith('xhs')) return 'xiaohongshu';
  if (n.startsWith('wechat')) return 'wechat';
  return 'other';
}
