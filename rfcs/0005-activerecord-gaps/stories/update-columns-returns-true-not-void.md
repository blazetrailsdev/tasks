---
title: "update_columns/update_column return true (Rails) not void"
status: done
updated: 2026-07-07
rfc: "0005-activerecord-gaps"
cluster: null
deps:
  - persistence-test-canonical-wave15
deps-rfc: []
est-loc: 40
priority: null
pr: 4586
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced during `persistence-test-canonical-wave14` (PR #4124). Rails
`ActiveRecord::Persistence#update_columns` returns `affected_rows == 1`
(a boolean — `true` on a successful single-row update, `true` for empty
attrs). trails `updateColumns` (packages/activerecord/src/persistence.ts,
`export async function updateColumns`) is typed `Promise<void>` and returns
nothing on both the empty-attrs early return and the normal path;
`updateColumn` (singular) just forwards its result, so it is also `void`.

This blocked a faithful port of `test_update_columns_with_default_scope`
(persistence_test.rb:1295), whose assertion is `assert
developer.update_columns(name: "Will")` — i.e. it checks the truthy return.
The test currently remains a bespoke stub in persistence.test.ts (tracked in
persistence-test-canonical-wave15); converging this return value unblocks its
faithful conversion.

## Acceptance criteria

- [ ] `updateColumns` returns a boolean matching Rails (`affected_rows == 1`;
      `true` for empty attrs), and `updateColumn` forwards it.
- [ ] No regressions in existing callers (they ignore the return today).
- [ ] Unblocks the faithful `update columns with default scope` port in
      persistence.test.ts (coordinate with persistence-test-canonical-wave15).
