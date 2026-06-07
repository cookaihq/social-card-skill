# Fork Extensions (cookaihq)

cookaihq-only behaviors added on top of the upstream 7-step workflow. These are additive; they do not replace any upstream step.

## During Step 3 — Style gallery link (hard precondition)

Text labels like "Swiss 工程感 + IKB 蓝" or "Editorial 杂志感" don't actually show the user what the look *is* — the gallery does. So **whenever the user is undecided and you're about to make them choose the visual system** (the 视觉风格 question in Step 3, and they haven't locked a system at intake), the message that *precedes* that choice **must** contain a clickable link to the built-in catalog. Don't gate it behind an extra "view gallery" option, and **don't** call `AskUserQuestion` for the style choice in a turn whose text doesn't already carry this link.

It's just one line — the gallery is a static file, so link straight to it (no server, no build, no command to run):

```
两套体系气质不同，先看实样再定 👉 风格图鉴（每个主题一张大样）：
file://<SKILL_DIR>/assets/style-gallery/index.html

看中哪套回来告诉我「体系 + 主题名」，例如 Swiss · IKB 蓝；只说体系也行，主题我按内容默认推荐。
```

Replace `<SKILL_DIR>` with this skill's real absolute base path (the one you were given when the skill loaded), so the `file://` URL resolves to the actual gallery on disk. Then present the Editorial / Swiss question as usual. When the user comes back with a system (and optionally a theme), continue to choose the theme and proceed to Step 4.

Why `file://` and not a local server: this gallery is a fully self-contained static page (HTML + inline CSS, no `<script>`, no ES module, no WebGL, no external loads), so it renders fine straight from disk — no server needed. (The "must use http, not file://" rule elsewhere is about the *card-production seed templates*, which do load an ES module + WebGL canvas; it does not apply to this catalog.) The gallery ships a pre-made full 3:4 poster for every one of the 10 themes (6 Editorial + 4 Swiss) — same layout per system, only the palette changes — so nothing is rendered or regenerated when the user opens it. Its palettes are sourced from `references/theme-presets.md`; if you change a theme token there, update the matching per-theme class in `assets/style-gallery/index.html` (the `.t-*` / `.a-*` blocks) too.

## After Step 7 — Overview gallery (always)

Once rendering is done and PNGs are in `<task>/output/`, build a neutral overview page so the user can see everything at once:

```bash
node scripts/build-overview.mjs <task-dir>
```

This writes `<task-dir>/overview/index.html` (self-contained, images copied into `overview/assets/`), grouping cards by deliverable (小红书 3:4 / 公众号 21:9+1:1 / 其他).

- Still show the rendered PNGs inline in chat first (upstream Step 7 behavior is unchanged).
- Then give the user the `overview/index.html` path.
- The overview page stays **local by default** — do not auto-publish it.
- A future opt-in publish handoff (feature 4, not yet implemented) will be able to upload this overview page; until then there is no publish step here.
