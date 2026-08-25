---
rfc: "0010-adapter-cleanup"
title: "Adapter → Connection collapse — remaining cleanup"
status: closed
created: 2026-05-30
updated: 2026-07-04
owner: "@deanmarano"
packages:
  - activerecord
clusters:
  - adapter-cleanup
related-rfcs:
  - "0007-remove-global-arel-visitor"
---

# RFC 0010 — Adapter → Connection collapse cleanup

## Summary

The Adapter→Connection collapse (Phases 1–2) shipped across PRs `#2395`, `#2401`,
`#2402`, `#2404`, `#2411`: the `Base.adapter` getter and `_adapter` field are gone,
all source call sites use pool-based `Base.connection`, and `DatabaseAdapter` was
widened to a
superset of `AbstractAdapter`. This RFC tracks the small remaining cleanup: delete
the `adapter.ts` barrel + `DatabaseAdapter` interface (blocked on Phase G), and a
possibly-moot `schema-ar-models.ts` audit. The per-adapter visitor work (old
PR C) is **subsumed by RFC 0007**.

## Motivation

A `static get adapter()` compatibility alias still bridges ~7000 test sites until
Phase G clears them, and ~134 import sites still re-export through `adapter.ts`.
Removing the barrel and the dead interface finishes the collapse, but must wait on
Phase G rewriting those imports.

## Design

Two discrete, independent cleanups (both branch from `main`, no stacking):

- **PR A** — delete `adapter.ts` + the `DatabaseAdapter` interface; update
  `index.ts` re-exports. Gated on Phase G clearing the ~134 barrel imports.
- **PR B** — audit `schema-ar-models.ts` for residual `set adapter()`; update to
  `set connection()` or close as moot.

## Alternatives considered

- **Delete the barrel now, fix the 134 imports in this RFC.** Rejected — Phase G
  rewrites those imports anyway (inline `Model.create()` → `useFixtures()` +
  `.adapter` → `.connection` in one pass); doing it separately duplicates churn.
- **Also delete the `get adapter()` compat alias / `set connection()` here.**
  Out of scope — that's ~6900 test-site conversions, a separate long-tail
  initiative gated on Phase G completion.

## Rollout

- [pr-b-schema-ar-models-audit](stories/pr-b-schema-ar-models-audit.md) — any time
  (ready).
- [pr-a-delete-adapter-barrel](stories/pr-a-delete-adapter-barrel.md) — after
  Phase G clears barrel imports (blocked).

## Cross-RFC notes

- **PR C (per-adapter Arel visitor / delete `setToSqlVisitor`) is subsumed by
  RFC 0007** (`0007-remove-global-arel-visitor`) — the same ~35-site `toSql`
  migration + global removal. Not duplicated here.
- The `get adapter()` / `set connection()` long-tail removal is a separate future
  initiative, gated on Phase G.
- **Initiative 3 — adapter hash-only constructor** (the third initiative in
  `adapter-architecture-cleanup.md`) is captured as a blocked story below
  (gated on trails #2700), so the source doc can be deleted.

## Changelog

- 2026-06-12: extract-pg-schema-statements-\* stories moved to 0000-adapter-layout-fidelity
- 2026-06-04: folded in Initiative 3 (adapter hash-only constructor, blocked on
  trails #2700) from `adapter-architecture-cleanup.md` during the RFC 0011
  cutover, so the source doc can be deleted.
- 2026-05-30: initial RFC, migrated from
  `trails/docs/activerecord/adapter-cleanup-plan.md`.
