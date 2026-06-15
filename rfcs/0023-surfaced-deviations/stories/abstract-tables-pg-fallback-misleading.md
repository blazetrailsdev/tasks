---
title: "abstract SchemaStatements#tables postgres fallback uses pg_tables (omits partitioned, public-only)"
status: draft
updated: 2026-06-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced in review of PR #3341 (pg-tables-include-partitioned). The
PostgreSQL adapter overrides `tables()` in
`postgresql/schema-statements-class.ts`, so this branch is dead for real PG
adapter users — but the generic fallback in
`abstract/schema-statements.ts` (~line 1124, the `case "postgres":` arm of
the dialect switch) still uses:

```sql
SELECT tablename AS name FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
```

This has the same fidelity gaps PR #3341 just fixed in the adapter path:

- `pg_tables` lists only ordinary tables (relkind `r`) and omits
  partitioned tables (relkind `p`).
- Hardcoded `schemaname = 'public'` ignores the search_path; Rails scopes
  via `ANY(current_schemas(false))`.

It is misleading dead code at minimum, and a latent bug for any future
caller that reaches the abstract fallback instead of the PG override.
Decide whether to converge the fallback to the `dataSourceSql`-equivalent
shape or remove the branch entirely if no path can reach it.

## Acceptance criteria

- [ ] PG fallback in `abstract/schema-statements.ts#tables` no longer omits
      partitioned tables / hardcodes `'public'`, OR the branch is removed if
      provably unreachable (PG adapter always overrides `tables()`).
- [ ] No regression on the SQLite/MySQL arms of the same switch.
