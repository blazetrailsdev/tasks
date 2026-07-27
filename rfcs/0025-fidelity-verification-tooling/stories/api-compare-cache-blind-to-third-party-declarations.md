---
title: "api:compare cache is blind to third-party declaration changes"
status: draft
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`api:compare`'s TS extraction cache is now keyed on each package's own
fingerprint, the resolved read-set of the extraction that produced the entry,
and `resolutionShapeKey` (PR #5380, `scripts/api-compare/shared-cache.ts`).

None of those cover THIRD-PARTY declarations. `normalizeReadSet` deliberately
drops every path under `node_modules` (`shared-cache.ts`, the `rel.split("/")
.includes("node_modules")` guard) and `resolutionShapeKey` only walks
`packages/*/dist`. Measured on actionview, 197 of its 241 resolved source files
are third-party: `@types/node`, `typescript`'s `lib.*.d.ts`, `undici-types`,
`@types/pg`. A dependency bump that changes any of those changes the extracted
surface, and every cache entry stays valid.

This was true before PR #5380 and before #5375 too, so it is not a regression —
but it is the last remaining input the cache cannot see. In practice these move
only on an install, which rewrites `pnpm-lock.yaml`.

## Acceptance criteria

- Third-party declaration changes invalidate the entries that resolved them,
  either by folding a lockfile hash into both cache keys (cheap, coarse) or by
  keeping the `node_modules` portion of the read-set (precise, costs a hash of
  ~200 files per package per run — measure before choosing).
- Whichever is chosen, a cached run and an `API_COMPARE_FORCE=1` run still agree
  after a dependency bump.
- Regression coverage in `scripts/api-compare/shared-cache.test.ts`.
- Report the added wall-clock cost of a fully-warm run; if the precise option
  costs more than the extraction it saves, take the lockfile option and say so
  at the call site.
