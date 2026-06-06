# Fork Extensions (cookaihq)

cookaihq-only behaviors added on top of the upstream 7-step workflow. These are additive; they do not replace any upstream step.

## During Step 3 — Style gallery, on request

Text labels like "Swiss 工程感 + IKB 蓝" or "Editorial 杂志感" don't actually show the user what the look *is*. So when you ask the user to choose the visual system (the 视觉风格 question in Step 3) — i.e. they haven't already locked a system at intake — offer a **third option** alongside the two systems:

```
📖 先打开风格图鉴看看再选（我起个本地预览，给你链接）
```

If the user picks it, serve the built-in catalog locally and hand back a clickable link:

1. **Launch the static server in the background** (it must not block the conversation). From the skill directory:

   ```bash
   node scripts/serve.mjs assets/style-gallery
   ```

   Use the skill's real path for both arguments if your cwd isn't the skill root (e.g. `node /abs/skill/scripts/serve.mjs /abs/skill/assets/style-gallery`). The script prints one line — the URL, e.g. `http://localhost:8137/` — and keeps running until killed. It auto-hunts for a free port if 8137 is taken, so read the URL from stdout rather than assuming the port.

2. **Give the user the clickable URL** plus a one-line prompt to come back with a choice:

   ```
   风格图鉴在这儿（看完回来告诉我「体系 + 主题名」，例如 Swiss · IKB 蓝）：
   http://localhost:<port>/
   ```

3. **Keep the server up while they browse** — it's a background process, so just continue the conversation. When the user comes back with a system (and optionally a theme), proceed to choose the theme and continue to Step 4. Once they've chosen, stop the server to free the port (kill the background process you started).

Why a local server and not a `file://` path: the Editorial seed template loads an ES module + a WebGL canvas, both of which browsers block under the `file://` origin; `http://localhost` also gives the user one clickable link instead of a long file path. The gallery is the same kind of self-contained page as the overview below, just shipped as a fixed asset (`assets/style-gallery/`) instead of built per task — it shows every built-in style, not this task's content. Its palettes are sourced from `references/theme-presets.md`; if you change a theme token there, update the matching swatch in `assets/style-gallery/index.html` too.

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
