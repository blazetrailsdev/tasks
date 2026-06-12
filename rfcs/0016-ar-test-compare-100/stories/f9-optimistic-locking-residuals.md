---
title: "F-9e — optimistic locking residuals"
status: in-progress
updated: 2026-06-12
rfc: "0016-ar-test-compare-100"
cluster: core-residuals
deps: []
deps-rfc: []
est-loc: 300
priority: 13
pr: 3159
claim: "2026-06-12T20:04:52Z"
assignee: "f9-optimistic-locking-residuals"
blocked-by: null
---

## Context

From the 2026-06-10 snapshot. `locking_test.rb` still has 11 matched-skips
(F-8's locking(12) line was only partially closed). Skips: `update/delete/destroy
with dirty primary key`, `lock without default queries count` (+ custom column),
`counter cache with touch and lock version`, `polymorphic destroy with
dependencies and lock version`, `increment/decrement counter updates lock
version`, `update counters updates lock version`.

## Acceptance criteria

- [ ] Un-skip the optimistic-locking behaviors above (dirty-PK update path,
      lock_version bump on counter touch/increment/decrement/update_counters,
      polymorphic dependent destroy).
- [ ] `locking_test.rb` reaches 0 matched-skips.
- [ ] Touched test files only.

## Notes

Rails: `activerecord/test/cases/locking_test.rb` + `locking/optimistic.rb`.
Counter-cache lock_version interplay overlaps F-9f; coordinate on shared models
(use `dropExisting:true` / unique table names to avoid shared-DB collisions).
