# Fork Extensions (cookaihq)

cookaihq-only behaviors added on top of the upstream 7-step workflow. These are additive; they do not replace any upstream step.

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
