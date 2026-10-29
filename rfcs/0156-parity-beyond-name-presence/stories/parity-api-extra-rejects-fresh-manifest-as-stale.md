---
title: "parity:api:extra rejects a just-regenerated ts-api.json as stale"
status: draft
updated: 2026-10-29
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found on trails#9436. `pnpm parity:api:extra --package actioncable` refused to run
and printed "output/ts-api.json predates the api-compared package sources — it
describes a different checkout". It still refused right after both
`pnpm parity:api` and `API_COMPARE_FORCE=1 pnpm parity:api` had finished in the
same worktree. The guard is `manifestIsStale(tsPath, apiComparePackageRoots())`
at `scripts/api-compare/extra-surface.ts:3306-3316`, with the freshness logic in
`build-freshness.ts`. `pnpm parity:api:extra:gate` ran on the same artifact and
passed, so one artifact is accepted by one command and rejected by the other.

The likely cause is that the guard compares `ts-api.json`'s mtime against package
sources whose mtimes move without a matching regeneration. Two things touched the
worktree here: a `git mv` of a trailties test file, and the README edits
lint-staged rewrote. Reproduce it before fixing.

## Acceptance criteria

- [ ] A repro: edit one file under a package root, run `pnpm parity:api`
      (forced and warm), then `pnpm parity:api:extra --package <pkg>`, and record
      which step leaves the manifest "stale".
- [ ] After a successful `pnpm parity:api`, `parity:api:extra` accepts the
      manifest, and it rejects one that was really built from another checkout.
- [ ] `parity:api:extra` and `parity:api:extra:gate` agree on whether the
      manifest is fresh.
