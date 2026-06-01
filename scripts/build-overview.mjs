import { readFileSync, readdirSync, mkdirSync, copyFileSync, writeFileSync, existsSync } from 'node:fs';
import { basename, join } from 'node:path';

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

export const GROUP_LABELS = {
  xiaohongshu: '小红书组图（3:4）',
  wechat: '公众号封面对（21:9 + 1:1）',
  other: '其他',
};

const GROUP_ORDER = ['xiaohongshu', 'wechat', 'other'];

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
  ));
}

// items: [{ file, group, width, height }] in display order.
export function buildHtml(items) {
  const sections = GROUP_ORDER
    .map((key) => ({ key, label: GROUP_LABELS[key], list: items.filter((it) => it.group === key) }))
    .filter((g) => g.list.length > 0)
    .map((g) => {
      const cards = g.list.map((it) => `
        <figure class="card">
          <img src="assets/${esc(it.file)}" alt="${esc(it.file)}">
          <figcaption>${esc(it.file)} · ${it.width}×${it.height}</figcaption>
        </figure>`).join('');
      return `
      <section class="group">
        <h2>${esc(g.label)} <span class="count">${g.list.length}</span></h2>
        <div class="grid">${cards}
        </div>
      </section>`;
    })
    .join('');

  return `<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>总览 · Social Card 产出</title>
<style>
  :root { color-scheme: light dark; }
  body { margin:0; font:16px/1.5 -apple-system,system-ui,"PingFang SC",sans-serif; background:#f6f6f7; color:#18181b; padding:32px; }
  h1 { font-size:22px; margin:0 0 24px; }
  .group { margin-bottom:40px; }
  .group h2 { font-size:16px; font-weight:600; border-bottom:1px solid #ddd; padding-bottom:8px; }
  .count { color:#888; font-weight:400; font-size:13px; margin-left:6px; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:16px; margin-top:16px; }
  .card { margin:0; background:#fff; border:1px solid #e5e5e5; border-radius:8px; overflow:hidden; }
  .card img { display:block; width:100%; height:auto; }
  figcaption { font-size:12px; color:#666; padding:8px 10px; word-break:break-all; }
</style>
</head>
<body>
  <h1>本次生成总览 · 共 ${items.length} 张</h1>
  ${sections}
</body>
</html>
`;
}

// Reads <taskDir>/output/*.png, copies them into <taskDir>/overview/assets/,
// writes <taskDir>/overview/index.html. Returns the index.html path.
export function buildOverview(taskDir) {
  const outputDir = join(taskDir, 'output');
  if (!existsSync(outputDir)) throw new Error(`no output dir: ${outputDir}`);
  const files = readdirSync(outputDir)
    .filter((f) => f.toLowerCase().endsWith('.png'))
    .sort();
  if (files.length === 0) throw new Error(`no PNGs in ${outputDir}`);

  const assetsDir = join(taskDir, 'overview', 'assets');
  mkdirSync(assetsDir, { recursive: true });

  const items = files.map((file) => {
    const buf = readFileSync(join(outputDir, file));
    let dims;
    try {
      dims = pngDimensions(buf);
    } catch (err) {
      throw new Error(`failed to read PNG dimensions for ${file}: ${err.message}`);
    }
    copyFileSync(join(outputDir, file), join(assetsDir, file));
    return { file, group: classify(file), width: dims.width, height: dims.height };
  });

  const indexPath = join(taskDir, 'overview', 'index.html');
  writeFileSync(indexPath, buildHtml(items));
  return indexPath;
}

// CLI: node scripts/build-overview.mjs <task-dir>
if (import.meta.url === `file://${process.argv[1]}`) {
  const taskDir = process.argv[2];
  if (!taskDir) {
    console.error('usage: node scripts/build-overview.mjs <task-dir>');
    process.exit(1);
  }
  console.log(buildOverview(taskDir));
}
