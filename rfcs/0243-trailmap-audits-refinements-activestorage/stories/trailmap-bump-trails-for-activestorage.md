---
title: "trailmap: bump trails past the attach-upload fix and depend on @blazetrails/activestorage"
status: ready
updated: 2026-11-18
rfc: "0243-trailmap-audits-refinements-activestorage"
cluster: storage
packages: ["activestorage"]
deps: [attach-touch-runs-commit-callbacks-on-a-second-instance]
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

**Lands in:** trailmap. It is a vendor bump only, so it is its own PR (trailmap
`CLAUDE.md`, "Bumping is its own PR").

## Context

trailmap's `vendor/` already holds `blazetrails-activestorage-0.1.0.tgz`
(packed by `scripts/vendor-trails.sh` at `vendor/TRAILS_PIN` a7270c9). But
it reaches the app only as trailties' optional peer (`pnpm-lock.yaml:347-352`),
and `package.json` does not list it. That pin predates two fixes this RFC
needs:

- trails#10009 (`trails-tsc-build-views-runs-initializers-before-engines`):
  without it, `pnpm build` loads `config/initializers` before engine
  initializers, and `hasOneAttached` is undefined. This is what blocked the
  0123 WIP.
- `attach-touch-runs-commit-callbacks-on-a-second-instance` (0189): without it,
  `attach` saves the rows but never uploads the file.

## Acceptance criteria

- [ ] `scripts/vendor-trails.sh <trails> <ref>` at a ref that contains both
      fixes. `vendor/TRAILS_PIN` names it.
- [ ] `package.json` lists `"@blazetrails/activestorage": "file:vendor/blazetrails-activestorage-0.1.0.tgz"`,
      and `pnpm install` resolves it as a direct dependency.
- [ ] Nothing else changes. `pnpm build`, `pnpm test` and `pnpm gate` are green.
