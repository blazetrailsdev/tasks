---
title: "Move the fork-count clamp into ar-db-slots via an os-adapter availableParallelism"
status: in-progress
updated: 2026-07-24
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 45
priority: null
pr: 5243
claim: "2026-07-24T17:26:53Z"
assignee: "clamp-fork-count-via-os-adapter"
blocked-by: null
closed-reason: null
---

## Context

PR #5198 made the AR advisory-slot pool track the _effective_ (host-clamped)
fork count rather than the raw `AR_DB_FORKS` request. The clamp
(`min(requested, availableParallelism() - 1)`) had to stay in
`vitest.config.ts:93-109`, which then rewrites `process.env.AR_DB_FORKS` to the
clamped result so `packages/activerecord/src/test-helpers/ar-db-slots.ts:37-42`
(`workerForkCount`) reads an already-effective value.

That indirection exists only because package sources may not import `node:os`
(eslint `blazetrails/no-node-builtins`, browser compat) and
`packages/activesupport/src/os-adapter.ts` exposes only `tmpdir` / `platform` /
`cwd` — no `availableParallelism`. So the clamp cannot live next to the code
that consumes it.

Consequence: `workerForkCount()` / `slotPoolSize()` called outside a vitest run
(no republished env var) return an unclamped request. Harmless today — the only
caller, `test-setup-worker-db.ts`, runs only under vitest, and over-provisioning
costs a few idle slot DBs — but the invariant is enforced by call order rather
than by the code.

## Acceptance criteria

- [ ] `OsAdapter` gains `availableParallelism()`, wired in the node adapter
      alongside `tmpdir`/`platform` (mind the sync-vs-async registration split
      documented in `os-adapter.ts` — the sync path fails under pure ESM).
- [ ] `ar-db-slots.ts` applies the clamp itself via the adapter, so
      `workerForkCount()` is correct regardless of who called it.
- [ ] `vitest.config.ts` no longer needs to rewrite `process.env.AR_DB_FORKS`;
      the republish and its call-site rationale comment come out.
- [ ] Existing `ar-db-slots.test.ts` coverage still passes, including the
      republish-contract test (rewritten against the adapter).
