# Fork Extensions (cookaihq)

cookaihq-only behaviors added on top of the upstream 7-step workflow. These are additive; they do not replace any upstream step.

## During Step 3 — Style gallery (offer the link up front)

Text labels like "Swiss 工程感 + IKB 蓝" or "Editorial 杂志感" don't actually show the user what the look *is*. So **before** you ask the user to choose the visual system (the 视觉风格 question in Step 3) — whenever they haven't already locked a system at intake — proactively serve the built-in catalog and put its link in the **same reply** that asks the question, so they can look while deciding. Don't gate it behind an extra "view gallery" option; the user shouldn't have to ask to see it.

1. **Start the static server in the background first** (it must not block the conversation), before you send the style question. From the skill directory:

   ```bash
   node scripts/serve.mjs assets/style-gallery
   ```

   Use the skill's real path for both arguments if your cwd isn't the skill root (e.g. `node /abs/skill/scripts/serve.mjs /abs/skill/assets/style-gallery`). The script prints one line — the URL, e.g. `http://localhost:8137/` — and keeps running until killed. It auto-hunts for a free port if 8137 is taken, so read the URL from stdout rather than assuming the port.

2. **Put the clickable link in the same reply, above the choice**, then present the Editorial / Swiss question as usual:

   ```
   两套体系气质不同，想先看实样再定？风格图鉴（每个主题一张大样）：
   http://localhost:<port>/

   看中哪套回来告诉我「体系 + 主题名」，例如 Swiss · IKB 蓝；只说体系也行，主题我按内容默认推荐。
   ```

3. **Keep the server up while they decide** — it's a background process, so just continue the conversation. When the user comes back with a system (and optionally a theme), proceed to choose the theme and continue to Step 4. Once they've chosen, stop the server to free the port (kill the background process you started).

Why a local server and not a `file://` path: the Editorial seed template loads an ES module + a WebGL canvas, both of which browsers block under the `file://` origin; `http://localhost` also gives the user one clickable link instead of a long file path. The gallery is a fixed, self-contained asset (`assets/style-gallery/index.html`), not built per task — it ships a pre-made full 3:4 poster for every one of the 10 themes (6 Editorial + 4 Swiss), so nothing is rendered or regenerated when it's served; same layout per system, only the palette changes. Its palettes are sourced from `references/theme-presets.md`; if you change a theme token there, update the matching per-theme class in `assets/style-gallery/index.html` (the `.t-*` / `.a-*` blocks) too.

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
