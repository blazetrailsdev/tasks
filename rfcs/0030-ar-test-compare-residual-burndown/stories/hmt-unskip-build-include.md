---
title: "hmt-unskip-build-include"
status: in-progress
updated: 2026-07-03
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4470
claim: "2026-07-03T03:21:49Z"
assignee: "hmt-unskip-build-include"
blocked-by: null
---

## Context

`packages/activerecord/src/associations/has-many-through-associations.test.ts` was converged in PR #4224. Four tests for `build`-then-persist patterns and `include?` on built (unsaved) records remain skipped:

- trails: `associations/has-many-through-associations.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/associations/has_many_through_associations_test.rb`

Skipped tests:

- `build then remove then save` (line 677) — `post.people.build(...)` then `post.people.delete(person)` before save; tests that built-but-then-removed record is not persisted
- `include method in association through should return true for instance added with build` (line 1521) — `post.people.include?(built_person)` returns true for an unsaved built record
- `include method in association through should return true for instance added with nested builds` (line 1529) — `include?` returns true for records built via nested `build` chains
- `assign array to new record builds join records` (line 1798) — assigning `[record]` to a `has_many :through` on an unsaved owner builds the join records without persisting

Rails source: `activerecord/lib/active_record/associations/collection_association.rb` — `include?` checks `target` for new records; `has_many_through_association.rb` — `build_record` and `concat_records` on new owner.

## Acceptance criteria

- [ ] Un-skip and pass all four tests under SQLite, PG, and MariaDB
- [ ] `include?(record)` returns true for records added via `build` even before save
- [ ] Building a record then deleting it from the proxy before save does not persist the join row
- [ ] Assigning an array to a HMT on an unsaved owner correctly stages join records for creation on owner save
- [ ] No production regressions in `has-many-through-associations.test.ts`
