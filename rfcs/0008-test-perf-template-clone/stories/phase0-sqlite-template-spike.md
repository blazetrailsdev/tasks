---
title: "Phase 0 — sqlite clonable-template spike"
status: claimed
updated: 2026-06-07
rfc: "0008-test-perf-template-clone"
cluster: test-perf
deps: []
deps-rfc: []
est-loc: 250
priority: 80
pr: null
claim: "2026-06-07T15:55:52Z"
assignee: "phase0-sqlite-template-spike"
blocked-by: null
---

## Context

Smallest end-to-end proof on sqlite3 only: build the canonical schema **once** in
`globalSetup` to a file template, then have each worker clone the file instead of
re-running `defineSchema(TEST_SCHEMA)` per file.

See RFC 0008 §Design (Phase 0) and §Acceptance for the prototype PR.

## Acceptance criteria

- [ ] `globalSetup` builds `<tmp>/ar-test-template.sqlite` once via
      `defineSchema(TEST_SCHEMA)`, using the async fs-adapter (NO `node:fs`),
      passing the path to workers via an env var
- [ ] Workers copy the template to a per-worker path and open that (async-fs
      copy) when `AR_TEST_TEMPLATE_PATH` is set and adapter is sqlite
- [ ] `isolate: true` unchanged; no cross-file state sharing
- [ ] `globalSetup` teardown unlinks the template; per-worker clones cleaned on
      exit
- [ ] Per-run token in worker paths (Date.now/Math.random ok in test infra) so
      concurrent local worktrees don't collide on advisory slots
- [ ] `adapters/sqlite3/**` + representative cross-section green; before/after
      wall-clock + setup-aggregate in the PR body (baseline: associations 14.1s,
      setup ~208s)
- [ ] Probe confirms canonical DDL runs exactly once for a multi-file run

## Notes

Supersedes the `isolate: false` approach (measured no-op in vitest 3.2.4 forks).
Do NOT ship `isolate: false` or `singleFork`/`singleThread` (2.4× regression). Do
NOT touch the global `beforeEach`. Bespoke-schema caveat: template covers only
`TEST_SCHEMA`; files defining extra tables still pay incremental DDL — document,
don't claim "DDL eliminated".
