---
title: "PostgreSQL addIndex inlines legacy _and_ index name instead of generateIndexName (no length/hash fallback)"
status: in-progress
updated: 2026-06-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 3364
claim: "2026-06-15T15:35:08Z"
assignee: "pg-add-index-inlines-legacy-index-name"
blocked-by: null
---

## Context

trails' PostgreSQL `addIndex`
(`packages/activerecord/src/connection-adapters/postgresql-adapter.ts:3565`)
derives the default index name by **inlining the legacy pattern** instead of
routing through `generateIndexName`:

```ts
const indexName =
  options.name ?? `index_${tableName.replace(/[."]/g, "_")}_on_${cols.join("_and_")}`;
```

Rails derives the name via `index_name(table_name, options)`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:992-998`)
→ `generate_index_name(table_name, column)` (`:1598`), which applies the
**identifier-length guard**: when the generated `index_<table>_on_<cols>` name
exceeds `index_name_length` (Postgres' 63-byte limit), Rails falls back to a
hashed name (`index_<table>_on_<hash>`) rather than emitting an over-long
identifier that Postgres silently truncates (producing collisions / `DROP
INDEX` mismatches).

trails already has `generateIndexName` and uses it on the **removeIndex** path
(`postgresql-adapter.ts:3725`, `genName = (t, c) => this.generateIndexName(t,
c)`), so `addIndex` and `removeIndex` can compute **different** names for the
same long table+columns: `addIndex` emits the raw over-long string, while
`removeIndex` looks for the hashed fallback — they no longer agree.

## Acceptance criteria

- [ ] PG `addIndex` derives its default index name via `this.generateIndexName`
      (or the `index_name`-equivalent resolution), so the length/hash fallback
      applies, matching Rails `schema_statements.rb:992-998` + `:1598`.
- [ ] An explicit `options.name` is still honored verbatim.
- [ ] `addIndex` and `removeIndex` compute the **same** default name for a
      table+columns combination long enough to trigger the hash fallback
      (regression test asserting add-then-remove round-trips by default name).
- [ ] Existing PG add-index tests (incl. the bare-column `where` cases) stay
      green; api:compare / test:compare delta non-negative.
