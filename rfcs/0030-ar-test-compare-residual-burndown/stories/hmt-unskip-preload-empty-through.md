---
title: "hmt-unskip-preload-empty-through"
status: ready
updated: 2026-06-28
rfc: "0030-ar-test-compare-residual-burndown"
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

`packages/activerecord/src/associations/has-many-through-associations.test.ts` was converged in PR #4224. One test for preloading an empty HMT via joins remains skipped:

- trails: `associations/has-many-through-associations.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/associations/has_many_through_associations_test.rb`

Skipped test:

- `preloading empty through association via joins` (line 1838) — `Author.preload(:tags).where(...)` preloads correctly when the HMT result is empty; verifies no crash and correct empty-collection result

Rails source: `activerecord/lib/active_record/associations/preloader/through_reflection.rb` — empty-through-result edge case.

## Acceptance criteria

- [ ] Un-skip and pass the test under SQLite, PG, and MariaDB
- [ ] Preloading a HMT that yields zero rows produces an empty loaded collection (not an error or nil)
- [ ] No production regressions in `has-many-through-associations.test.ts`
