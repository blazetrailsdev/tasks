---
title: "activestorage: enroll lib in rails-private-jsdoc so the scoped gate does not exit 2"
status: draft
updated: 2026-11-24
rfc: "0142-trailties-surfaced-deviations"
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

`scripts/ci/scoped-comparison.sh:64` runs `eslint --config eslint/rails-private-jsdoc.config.mjs $src` per changed package. `packages/activestorage` is not in that config's `files` list (`eslint/rails-private-jsdoc.config.mjs:43-62`), so every file under `packages/activestorage/lib` is ignored and ESLint exits 2 ("all of the files matching the glob pattern are ignored"). Seen in `pnpm parity:changed` on trails#10688.

## Acceptance criteria

- [ ] activestorage `lib/**` is enrolled in `rails-private-jsdoc` (and its root config twin), or the scoped step skips packages that are not enrolled.
- [ ] `pnpm parity:changed` passes the rails-private step for an activestorage-only change.
