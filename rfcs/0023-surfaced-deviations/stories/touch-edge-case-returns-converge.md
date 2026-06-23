---
title: "touch edge-case returns diverge from Rails (not-persisted, empty-names)"
status: in-progress
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: 40
pr: 3951
claim: "2026-06-23T02:03:16Z"
assignee: "touch-edge-case-returns-converge"
blocked-by: null
---

## Context

`touch` (packages/activerecord/src/timestamp.ts) diverges from Rails'
`ActiveRecord::Persistence#touch` (vendor/rails/activerecord/lib/active_record/persistence.rb:793)
in two edge-case return paths, both surfaced while wiring touch into the
transactional-callback machinery (PR #3500):

1. **Not-persisted:** trails does `if (!this.isPersisted()) return false;`
   (timestamp.ts:29). Rails calls `_raise_record_not_touched_error unless persisted?`
   (persistence.rb:794) — it RAISES `ActiveRecord::ActiveRecordError`, it does not
   return false.

2. **Empty attribute names:** trails does `if (touchCols.length === 0) return false;`
   (timestamp.ts ~75). Rails' `unless attribute_names.empty? ... else true end`
   (persistence.rb:805-810) returns `true` when there are no timestamp columns and no
   caller-supplied names.

## Acceptance criteria

- [ ] `touch` on a non-persisted record raises `ActiveRecordError`
      (mirror `_raise_record_not_touched_error`), not `return false`.
- [ ] `touch` with no timestamp columns and no names returns `true`, matching Rails.
- [ ] Find/port the corresponding Rails persistence_test.rb assertions; un-skip if a
      matching skipped test exists, otherwise add one with a Rails-verbatim name.
- [ ] No new api:compare / test:compare gate-mismatches.
