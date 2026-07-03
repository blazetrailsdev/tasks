---
title: "hmt-unskip-dependent-nullify"
status: in-progress
updated: 2026-07-03
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4488
claim: "2026-07-03T15:21:50Z"
assignee: "hmt-unskip-dependent-nullify"
blocked-by: null
---

## Context

`packages/activerecord/src/associations/has-many-through-associations.test.ts` was converged in PR #4224. Three tests for `dependent: :nullify` through-association behavior remain skipped:

- trails: `associations/has-many-through-associations.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/associations/has_many_through_associations_test.rb`

Skipped tests:

- `delete all for with dependent option nullify` (line 547) — `person.jobsWithDependentNullify.delete_all` nullifies FKs instead of deleting join rows
- `update counter caches on delete with dependent nullify` (line 939) — counter cache decremented after nullify-delete
- `delete_all for with dependent option nullify` (line 2423) — duplicate scenario testing the same nullify path

Rails source: `activerecord/lib/active_record/associations/has_many_through_association.rb` — `delete_records` with `delete_through_records: false` for `:nullify`.

## Acceptance criteria

- [ ] Un-skip and pass all three tests under SQLite, PG, and MariaDB
- [ ] `has_many :jobs, through: :references, dependent: :nullify` nullifies the FK on the through record instead of deleting it
- [ ] Counter cache columns update correctly after nullify-based delete
- [ ] No production regressions in `has-many-through-associations.test.ts`
