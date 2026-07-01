---
title: "habtm-scope-unscope-not-threaded-through-eager-load"
status: ready
updated: 2026-07-01
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced while porting
`packages/activerecord/src/associations/has-and-belongs-to-many-associations.test.ts`
word-for-word (RFC 0048, story `redo-habtm-associations-faithful-port`).

Rails `test_habtm_scope_can_unscope` exercises a habtm association whose scope
is `-> { unscope(where: "name") }` pointing at a target model
(`LazyBlockDeveloperCalledDavid`) with `default_scope { where(name: "David") }`.
Pushing a "Not David" developer and eager-loading via
`ProjectUnscopingDavidDefaultScope.includes(:developers)` should yield 1 —
the association scope unscopes the target's default `name` filter.

In trails the `unscope(where: "name")` is honored on the **direct** association
load path (verified: `project.developers.size()` returns 1) but is **NOT**
threaded into the **eager-load/preload** query built by `includes(:developers)`,
so the target's `default_scope where(name: "David")` survives and filters the
"Not David" row out → size 0.

- Test: `has-and-belongs-to-many-associations.test.ts` → `it.skip("habtm scope can unscope")`
  (tracked-pending-convergence, references this story).

## Acceptance criteria

- [ ] The habtm association scope (including `unscope(where: ...)`) is applied to
      the eager-load/preload query, matching the direct-load path and Rails.
- [ ] Un-skip `habtm scope can unscope` in the HABTM associations test; it passes.
- [ ] No canonical-schema or fixture regressions.
