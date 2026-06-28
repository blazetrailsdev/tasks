---
title: "hmt-unskip-destroy-methods"
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

`packages/activerecord/src/associations/has-many-through-associations.test.ts` was converged to the canonical schema in PR #4224. Three tests remain skipped because HMT `destroy`/`destroy_all` is not fully implemented:

- trails: `associations/has-many-through-associations.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/associations/has_many_through_associations_test.rb`

Skipped tests (lines in the converged file):

- `destroy association` (line 715) — `post.people.destroy(person)` should delete the through record and return person
- `destroy all` (line 730) — `post.people.destroy_all` deletes all through records
- `should raise exception for destroying mismatching records` (line 798) — `destroy` with a record not in the association raises ActiveRecordError

Rails source: `activerecord/lib/active_record/associations/has_many_through_association.rb` — `destroy_records` / `delete_records`.

## Acceptance criteria

- [ ] Un-skip and pass all three tests under SQLite, PG, and MariaDB
- [ ] `destroy` on a HMT removes the join row, not the target record (unless `dependent: :destroy` on the source)
- [ ] `destroy_all` clears all join rows for the owner
- [ ] Destroying a record not in the association raises `ActiveRecord::AssociationTypeMismatch` or equivalent
- [ ] No production regressions in `has-many-through-associations.test.ts` (140 currently passing)
