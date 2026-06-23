---
title: "abstract-sqlite-indexes-arm-result-shape-diverges-from-canonical"
status: in-progress
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3963
claim: "2026-06-23T10:42:39Z"
assignee: "abstract-sqlite-indexes-arm-result-shape-diverges-from-canonical"
blocked-by: null
---

## Context

Surfaced during review of #3958 (which converged the abstract
`SchemaStatements` sqlite introspection arm's PRAGMA _targets_ to
`SQLite3Adapter`'s schema-prefix form). The PRAGMA shape now matches, but the
abstract `indexes()` sqlite arm
(`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts`,
the `case "sqlite"` block) still diverges from the canonical
`packages/activerecord/src/connection-adapters/sqlite3/schema-statements.ts`
(the `sqliteIndexes` impl, ~:120-170) in result shape:

- It does NOT skip SQLite's `sqlite_*` auto-created internal indexes.
- It does NOT read the index SQL (from `sqlite_master`/`sqlite_temp_master`)
  to recover partial-index WHERE clauses or expression indexes.
- It does NOT fall back to parsed expressions when `index_info` returns
  nameless columns (expression indexes), nor parse DESC orders.

This arm is the fallback used by `introspectIndexes` when an adapter doesn't
implement `indexes()` (`schema-introspection.test.ts`), so the divergence is
reachable, just lower-fidelity than the concrete adapter.

## Acceptance criteria

- [x] Converge the abstract `indexes()` sqlite arm's result shape to
      `sqlite3/schema-statements.ts` `sqliteIndexes`: skip `sqlite_*` indexes,
      recover WHERE/expression indexes from the index SQL, handle nameless
      (expression) columns and DESC orders — or factor `sqliteIndexes` so both
      paths share it.
- [x] No production behavior change for the concrete SQLite3 adapter path.
- [x] api:compare / test:compare delta non-negative.
