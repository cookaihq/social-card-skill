# Maintaining this fork

`cookaihq/social-card-skill` is a fork of [`op7418/guizang-social-card-skill`](https://github.com/op7418/guizang-social-card-skill), with cookaihq-specific additions (see `references/fork-extensions.md`).

## Syncing upstream

- `upstream` remote points at op7418. GitHub shows when this fork is behind.
- To pull updates:
  ```bash
  git fetch upstream
  git merge upstream/main
  # resolve conflicts, test, then push
  ```

## Low-conflict discipline

- Put cookaihq additions in NEW files (`scripts/build-overview.mjs`, `references/fork-extensions.md`, `catalog/`, etc.).
- Touch upstream files minimally. SKILL.md additions go in the appended `## Fork Extensions (cookaihq)` section only.

## Known intentional divergences

- Skill identity renamed to `social-card-skill` (SKILL.md `name:`/H1, package.json, agents/openai.yaml, READMEs, PRODUCT/HANDOFF titles).
- AGPL: op7418 attribution retained; fork maintained by cookaihq.
