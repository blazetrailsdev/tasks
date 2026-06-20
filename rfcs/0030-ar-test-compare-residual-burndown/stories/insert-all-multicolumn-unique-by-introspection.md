---
title: "upsert_all multi-column unique_by index introspection"
status: in-progress
updated: 2026-06-20
rfc: "0030-ar-test-compare-residual-burndown"
cluster: persistence
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 3744
claim: "2026-06-20T22:17:27Z"
assignee: "insert-all-multicolumn-unique-by-introspection"
blocked-by: null
---

## Context

`packages/activerecord/src/insert-all.test.ts` "upsert all updates using
provided sql and unique by" is gated to the conjunction
`insert_conflict_target,insert_on_duplicate_update` but `ctx.skip()`-pending.
Blocked on multi-column unique-index introspection: the test upserts with
`unique_by: [name, author_id]`, which requires resolving a composite unique
index. Rails: `insert_all_test.rb:812`. Cited tracking story
`d2-insert-all-unique-index-introspection` is closed (done) but this test was
never implemented.

## Acceptance criteria

- [ ] `find_unique_index_for` (or equivalent) resolves a multi-column
      `unique_by` against the schema cache / index introspection.
- [ ] Drop `ctx.skip()`; test runs on adapters supporting both features.
- [ ] `test:compare` delta non-negative; test name unchanged.
