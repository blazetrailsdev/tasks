---
title: "PG oid introspection surfaces spurious limit: 8"
status: ready
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced during `c1-schema-dumper-parity` (PR #3426). Rails' PG oid column
reports `limit == nil` — `NATIVE_DATABASE_TYPES[:oid]` carries no `:limit`
(postgresql_adapter.rb:177) — and `schema_limit` only emits a `limit:` when the
column's limit differs from the native type's (abstract/schema_dumper.rb:64), so
`t.oid` dumps bare. trails PG introspection **diverges**: it surfaces `limit: 8`
on oid columns.

PR #3426 worked around the dump symptom with a `schemaType(column) === "oid"`
guard in `schemaLimit` (`connection-adapters/abstract/schema-dumper.ts`) plus a
matching `dslType !== "oid"` guard in the base `schema-dumper.ts` emit path, so
`t.oid` dumps bare. That guard only covers the dump path — any other oid-typed
code path that reads the introspected column limit still sees the spurious 8.

## Acceptance criteria

- [ ] PG column introspection no longer surfaces `limit: 8` for `oid` columns
      (or `schemaLimit` gains a general `native_database_types` limit comparison
      mirroring the existing `isSerial` special-case), so the dumper guard
      becomes redundant.
- [ ] Remove the `schemaType === "oid"` / `dslType !== "oid"` workaround guards
      once the root cause is fixed.
- [ ] `schema dump oid type` still passes on PG.
