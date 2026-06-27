---
title: "relation-or-fold-quadratic-perf"
status: claimed
updated: 2026-06-27
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 91
pr: null
claim: "2026-06-27T19:26:33Z"
assignee: "relation-or-fold-quadratic-perf"
blocked-by: null
---

## Context

`Relation#or` folding is O(n²): folding 1001 relations with `paragraphs.reduce((acc, rel) => acc.or(rel))` takes ~21.5s of pure CPU (build only, before any SQL/DB) on a dev machine. Measured while porting `relation/or.test.ts` (`TooManyOrTest#test_too_many_or`, PR #4178) — the test needed a 120s per-test timeout because the default 5s wall killed the build mid-flight (timing out MariaDB and poisoning the PG transactional-fixtures teardown with 25P02).

Each `acc.or(rel)` runs `structurallyIncompatibleValuesFor` (iterates STRUCTURAL_FIELDS, `deepEqual` over the growing where-clause predicate arrays) plus a where-clause clone whose size grows by one predicate per step — so the fold is O(n²) in predicate count. Rails folds the same 1001-deep `inject(&:or)` without this cost.

- trails: `packages/activerecord/src/relation/query-methods.ts` (`structurallyIncompatibleValuesFor`, `orBang`/where-clause `or`), `relation/or.test.ts:274` (`TooManyOrTest`).
- Rails: `vendor/rails/activerecord/lib/active_record/relation/query_methods.rb` `#or!`, `where_clause.rb` `#or`.

## Acceptance criteria

- [ ] Folding 1001 `#or`s builds in well under the 5s default test budget (target: drop the 120s override on `TooManyOrTest#test_too_many_or`).
- [ ] No fidelity regression: `structurallyIncompatibleValuesFor` and `WhereClause#or` still mirror Rails semantics (common-predicate factoring, structural-compat raising).
- [ ] `relation/or.test.ts` stays green on sqlite/postgres/mariadb lanes.
