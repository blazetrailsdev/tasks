---
title: "reflectColumnNames' base-only invalidation branch is unreachable from tests (warm cache short-circuit)"
status: claimed
updated: 2026-07-24
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 25
pr: null
claim: "2026-07-24T16:15:36Z"
assignee: "reflect-column-names-cold-cache-branch-untestable"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #5178 (STI per-class columns memo) and raised twice in review.

`reflectColumnNames` in `packages/activerecord/src/model-schema.ts` has a
branch that, once the shared schema cache warms, drops the base's
`_schemaLoaded` / `_columnsHash` / `_columns` and clears the attribute-name
memos — so the next `loadSchema` re-reflects instead of serving the minimal
synthesized view built while the cache was cold. It is the one live path that
invalidates the base WITHOUT touching STI descendants' own memos, which is why
PR #5178 added `invalidateStiDescendantColumnMemos` to `applyColumnsHash`.

That branch is currently untestable from the AR suite: `reflectColumnNames`
opens with `const cached = cachedColumnNames(host); if (cached) return cached;`,
and under `fixtures({})` the canonical schema cache is always warm, so the
function returns before reaching the clearing branch. The regression test in
`base.trails.test.ts` ("an STI subclass's own columns memo is rebuilt when the
base re-reflects") therefore SIMULATES the end state by assigning
`_columnsHash` / `_columns` / `_schemaLoaded` on the base directly. Verified:
driving it through `reconcileVirtualAttributes(this, true)` leaves
`Company._columnsHash` populated and the test fails.

Consequence: the descendant-invalidation guard is covered, but the wiring that
produces the state it guards is not. A future edit to `reflectColumnNames` that
skips the `if (host._schemaLoaded)` drop (or returns early on
`names.length === 0`) would not fail any test.

## Acceptance criteria

- A test harness can reach `reflectColumnNames`' cold-cache path — either a
  fixture that starts with an unwarmed schema cache for one canonical table, or
  a seam that lets a test force `cachedColumnNames` to miss.
- A test drives `reconcileVirtualAttributes(host, true)` on a cold cache and
  asserts the base's `_schemaLoaded`/`_columnsHash`/`_columns` are dropped and
  the name memos cleared.
- The `base.trails.test.ts` STI memo test is rewritten to run through that real
  path instead of assigning the base's internals, or keeps its simulation with
  the new test covering the wiring alongside it.
