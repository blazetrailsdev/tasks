---
title: "A1c — eager_test: where/from references association name + implicit references"
status: draft
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: associations
deps: []
deps-rfc: []
est-loc: null
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Split off from `a1-eager-preloader-semantics` (RFC 0030). eager_test.rb cases where a `where`/`from` references an **association/aliased table name** and must add implicit `references` (type-cast, attribute-alias, `where.not`, SQL-string condition with no backing column, `calculate` with string `from`, two-table `from` without double-quoting). Needs `eager.ts` implicit-references + FROM handling.

Rails: vendor/rails/activerecord/test/cases/associations/eager_test.rb.

### Tests to un-skip

- type cast in where references association name
- attribute alias in where references association name
- calculate with string in from and eager loading
- with two tables in from without getting double quoted
- including associations with where.not adds implicit references
- including association based on sql condition and no database column

## Acceptance criteria

- [ ] Each listed test un-skipped + passing (Rails-faithful, canonical models/fixtures) or reclassified permanent-skip with reason.
- [ ] No new gate-mismatches.
