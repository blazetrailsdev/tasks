---
title: "Alias JOINs to the association name (Rails parity) to enable self-join where-hash disambiguation"
status: draft
updated: 2026-06-11
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced by PR #3124 (`where-nested-hash-assoc-name-table-resolution`).

Rails aliases an association JOIN to the association name when it differs from
the table name, e.g.:

```sql
INNER JOIN "rp_categories" "special_categories"
  ON "special_categories"."id" = ...
WHERE "special_categories"."name" = 'Tech'
```

trails does **not** alias the JOIN — it emits `INNER JOIN "rp_categories"` with
no alias. To compensate, PR #3124 added a `!reflection` guard in
`TableMetadata#associatedTable` (`table-metadata.ts`) so a camelCase
association-name where-hash key resolves to the underlying snake_case table
name instead of aliasing to the (non-joined) association identifier. This is an
intentional, documented deviation from Rails `associated_table:44`, which
always aliases to the key.

The fully Rails-faithful approach is to alias the JOIN to the association name
in trails' join construction. Then `associatedTable` could drop the
`!reflection` guard and mirror Rails exactly (always alias). This is the
prerequisite for **self-join where-hash disambiguation** — two associations to
the same table, keyed by association name in `where()` — which the current
approach cannot express because both would collapse to the same bare table
name.

## Scope / risk

- Touches join SQL construction (alias tracker / join-dependency building).
- **Blast radius: many activerecord tests assert exact non-aliased join SQL.**
  Expect to update join-SQL expectations across the suite.
- est ~200 LOC, medium risk. Not a quick win — schedule deliberately.

## Acceptance criteria

- [ ] Association JOINs whose association name differs from the table name are
      aliased to the association name (Rails parity), matching
      `INNER JOIN "<table>" "<assoc_name>"`.
- [ ] `TableMetadata#associatedTable` drops the `!reflection` guard and mirrors
      Rails `associated_table` (always alias to the key).
- [ ] `where({ assocA: {...}, assocB: {...} })` with two associations to the
      same table produces distinct aliases (self-join disambiguation).
- [ ] No regression: existing join-SQL expectations updated, all green.
- [ ] `api:compare` / `test:compare` delta non-negative.
