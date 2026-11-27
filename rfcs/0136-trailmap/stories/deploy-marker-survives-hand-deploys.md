---
title: "trailmap: deploy.sh --from-image detects a hand deploy of the same sha instead of rebuilding git source"
status: ready
updated: 2026-11-27
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced on trailmap#208 (review rounds 3–5). `scripts/deploy.sh --from-image` takes the `dokku ps:rebuild` path only when `DEPLOYED_IMAGE` names `<image>:<sha>` and `GIT_REV == sha`. A deploy outside the script of the SAME sha (a manual `git push dokku`, a `ps:rebuild`, a rollback) leaves both values matching. The next `--from-image` then rebuilds git source, not the CI image. docs/deploy.md ("From the CI-built image") documents the trap and the `config:unset DEPLOYED_IMAGE` that clears it.

## Acceptance criteria

- The script detects that the running release did not come from `git:from-image` (for example from dokku's `builder` / `git:report` source-image field, or an image label CI stamps with the sha) and runs the full `git:from-image` in that case.
- The docs caveat is removed.
