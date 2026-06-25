---
rfc: "0008-test-perf-template-clone"
title: "AR test perf — canonical schema as a clonable template"
status: closed
created: 2026-05-30
updated: 2026-06-20
owner: "@deanmarano"
packages:
  - activerecord
clusters:
  - test-perf
---

# RFC 0008 — AR test perf: clonable schema template

## Summary

Every `.test.ts` in the `activerecord` project rebuilds the canonical fixture
schema from scratch (hundreds of `CREATE TABLE` per file, dominating wall-clock
on MariaDB). Pay the canonical DDL **once for the whole run** by building a schema
template in `globalSetup` and cloning it cheaply per worker — the JS analog of
Rails' `db:test:prepare`. Start with a sqlite-only spike, then PG, then maybe
MariaDB.

## Motivation

With vitest `isolate: true` (default), the module graph reloads per file, so
`bootstrapTestHandler` + the canonical `defineSchema(TEST_SCHEMA)` preload run
once **per file**. On MariaDB at ~30ms/CREATE this dominates wall-clock and is why
`hookTimeout` is bumped to 30s. Baseline: associations dir = 14.1s, setup
aggregate ~208s.

## Design

Build a template once in `globalSetup`; each worker clones it (file copy for
sqlite; `CREATE DATABASE ... TEMPLATE` for PG). `isolate: true` is **kept** —
there's no cross-file state sharing, so the entire module-leak hazard class is
avoided. Use the async fs-adapter (no `node:fs`); per-run token in worker paths so
concurrent local worktrees don't collide.

## Alternatives considered

- **`isolate: false`.** Rejected — measured a **no-op** in vitest 3.2.4's forks
  pool: it reloads the full module graph per file and does not share `schemaCache`
  / the handler / the warm `:memory:` DB.
- **`singleFork` / `singleThread` (+ `--no-isolate`).** Rejected — truly shares
  state but serializes every file: measured **33.3s vs 14.1s** (2.4× slower) by
  throwing away file-level parallelism.

## Rollout

1. **Phase 0 (spike)** —
   [phase0-sqlite-template-spike](stories/phase0-sqlite-template-spike.md): sqlite
   only, end-to-end proof + measurement.
2. **Phase 1** — [phase1-pg-template](stories/phase1-pg-template.md):
   `CREATE DATABASE ... TEMPLATE`.
3. **Phase 2** — [phase2-mariadb-template](stories/phase2-mariadb-template.md):
   only if it beats per-fork DDL (measure first).

## Open questions

1. **Per-worker DB on disk vs `:memory:` (sqlite).** Disk (file copy) is the
   spike default; measure whether restoring into `:memory:` via the backup API is
   worth the plumbing.
2. **`globalSetup` ↔ worker env handoff.** Confirm vitest propagates env set in
   `globalSetup` to forked workers, else write the path to a fixed tmp filename.
3. **fs-adapter on the hot path.** Confirm the async-fs template copy per worker
   isn't itself a bottleneck on CI disk.

## Changelog

- 2026-05-30: initial RFC, migrated from
  `trails/docs/activerecord/test-perf-template-clone-plan.md`.
