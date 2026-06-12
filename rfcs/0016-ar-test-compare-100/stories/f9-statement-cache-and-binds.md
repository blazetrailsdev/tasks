---
title: "F-9b — statement cache + bind parameters"
status: ready
updated: 2026-06-11
rfc: "0016-ar-test-compare-100"
cluster: core-residuals
deps: []
deps-rfc: []
est-loc: 350
priority: 12
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

From the 2026-06-10 snapshot. `bind_parameter_test.rb` (17 matched-skips) plus
`statement_cache_test.rb` (3) form an un-owned cluster around prepared-statement
caching. Skips: `statement cache` / `… with query cache` / `… with find` /
`… with find by` / `… with in clause` / `… with sql string literal`; `too many
binds` (+ with query cache); `bind from join in subquery`; `binds are logged`.

## Acceptance criteria

- [ ] Implement / un-skip the StatementCache + bind-parameter behaviors above.
- [ ] `bind_parameter_test.rb` and `statement_cache_test.rb` reach 0 matched-skips
      (or permanent residue documented in `unported-files.ts`).
- [ ] Touched test files only.

## Notes

Rails: `activerecord/test/cases/bind_parameter_test.rb`,
`statement_cache_test.rb`, `statement_cache.rb`. `too many binds` is adapter
bind-limit dependent (PG 65535 / SQLite 999) — gate per backend.
