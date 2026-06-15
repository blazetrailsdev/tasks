---
title: "relation_scoping residuals: includes-scoping, STI find constraint, unscoped cache busting"
status: ready
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: relation-scoping
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced by RFC 0030 story b1-relation-scoping (PR #3413). Three independent
relation_scoping_test.rb cases remain it.skip on distinct engine gaps:

1. `scoped find include` — `Developer.includes(:projects).scoping { where("projects.id" => 2) }`
   needs the eager-load JOIN built by the scoped relation visible to the inner
   where that references the included table.
2. `scoping respects sti constraint` — `SpecialComment.find(1)` (an out-of-type
   row) must raise RecordNotFound; STI `find(id)` does not enforce the type
   constraint at query time.
3. `unscoped breaks caching` / `scope breaks caching on collections` —
   `FirstPost.unscoped { author.reload.first_post }` must invalidate the cached
   singular/collection association so the unscoped reload re-queries.

## Acceptance criteria

- Each gap fixed and the corresponding case un-skipped in
  scoping/relation-scoping.test.ts (may be split into per-gap stories).
