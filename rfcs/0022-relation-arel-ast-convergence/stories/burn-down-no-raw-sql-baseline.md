---
title: "Burn down no-raw-sql baseline: migrate flagged raw-SQL/string-surgery sites to arel"
status: in-progress
updated: 2026-06-13
rfc: "0022-relation-arel-ast-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 3211
claim: "2026-06-13T21:12:35Z"
assignee: "burn-down-no-raw-sql-baseline"
blocked-by: null
---

## Context

The `blazetrails/no-raw-sql` ESLint rule (merged in #3163, RFC 0025) ships a
ratchet baseline (`eslint/no-raw-sql-exclude.json`) grandfathering current
violators. The string-assembled-SQL sites in the relation/query layer are the
RFC-0022 burndown targets and should migrate to `@blazetrails/arel`, then drop
out of the baseline.

`noSqlSurgery` (the `sql.replace`/`sql.concat` string-surgery anti-pattern):

- `relation.ts:3933`, `relation.ts:4221`
- `relation/calculations.ts:313`
- `relation/query-methods.ts:863`
- `relation/where-clause.ts:114`

`noRawSql` (raw SQL passed to an execution sink):

- `persistence.ts:618`, `persistence.ts:1079`
- `migrator.ts:45`

Split across multiple PRs if needed (500 LOC ceiling). Each migrated file is
removed from `eslint/no-raw-sql-exclude.json` in the same PR, keeping lint
green and shrinking the baseline toward zero. The test-helpers/test-setup DDL
entries are tracked separately (see 0025 `no-raw-sql-scope-out-ddl-infra` —
those are infra that legitimately renders DDL, not arel-migration targets).

## Acceptance criteria

- [ ] The listed relation/query/persistence/migrator sites build SQL via
      `@blazetrails/arel` rather than string assembly or string surgery.
- [ ] Each migrated file is dropped from `eslint/no-raw-sql-exclude.json`;
      `pnpm lint` stays green.
- [ ] No behavior change vs Rails — verify against the corresponding Rails
      source for each site before rewriting.
