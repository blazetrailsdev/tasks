---
title: "find_with_ids compacts + uniqs ids before size dispatch like Rails"
status: in-progress
updated: 2026-06-25
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 4116
claim: "2026-06-25T13:19:32Z"
assignee: "find-with-ids-compact-uniq-before-dispatch"
blocked-by: null
---

## Context

Surfaced while implementing `finder-single-element-array-dispatches-find-one`
(PR #4109). Rails `find_with_ids` collapses the id list with
`ids = ids.compact.uniq` BEFORE the `case ids.size` dispatch
(`activerecord/lib/active_record/relation/finder_methods.rb:502`). So:

- `find([1, 1])` → after uniq, size 1 → `find_one(1)` → scalar (or `[record]`
  when `expects_array`), NOT a 2-id `find_some`.
- `find([1, nil])` → after compact, size 1 → `find_one(1)`.
- `find(nil)` / `find([nil])` → after compact, size 0 → "without an ID" branch.

trails does NOT compact/uniq. Both finder paths route the raw, un-deduped list:

- `packages/activerecord/src/relation/finder-methods.ts` `normalizeFindArgs`
  (`flat(Infinity)` only — no `compact`/`uniq`), feeding `performFind`.
- `packages/activerecord/src/core.ts` `find` (raw `id` array → `where({pk: ids})`).

Result: `find([1, 1])` on an existing record raises the aggregate "couldn't
find all" miss (count 1 != expected 2) instead of returning the record, and nil
entries are not stripped.

(The empty-array `find([])` → `[]` and zero-arg "without an ID" cases are
already converged / tracked separately — see `find-empty-array-returns-empty-not-raises`
and `find-without-id-message-convergence`.)

## Acceptance criteria

- [ ] Both finder paths apply Rails' `compact.uniq` to the flattened simple-PK
      id list before the size-based dispatch.
- [ ] `find([1, 1])` returns the single record (wrapped per `expects_array`),
      `find([1, nil])` dispatches to the single-id path, matching Rails.
- [ ] Tests named to match the corresponding Rails `finder_test.rb` cases
      (read them first).
