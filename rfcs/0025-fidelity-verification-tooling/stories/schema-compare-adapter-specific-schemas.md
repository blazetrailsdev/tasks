---
title: "schema:compare — include the four adapter-specific schema.rb companions"
status: draft
updated: 2026-07-19
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm schema:compare` (PR #4966) reads only
`vendor/rails/activerecord/test/schema/schema.rb`. Rails declares further
canonical tables in four adapter-specific companions in the same directory:

- `postgresql_specific_schema.rb`
- `mysql2_specific_schema.rb`
- `sqlite_specific_schema.rb`
- `trilogy_specific_schema.rb`

Consequence: any TEST_SCHEMA table mirroring one of those files is reported as
an **invented table**, the one false verdict the tool is built to never emit.
This did not bite in #4966 — the 91 baselined inventions were manually verified
absent from all five files — but it is latent, and it will fire the moment
someone ports a PG-specific canonical table (the PG-only `ColumnSpec` types
`citext` / `hstore` / `uuid` / `interval` / `oid` in
`packages/activerecord/src/test-helpers/schema-types.ts` exist precisely for
such tables).

The parser is already adapter-agnostic; the gap is source selection plus
deciding how an adapter-scoped table should be reported when TEST_SCHEMA lays
it unconditionally.

## Acceptance criteria

- The comparator parses the adapter-specific schema files alongside `schema.rb`
  and treats their tables as canonical, so mirroring one is never INVENTED.
- Findings record which source file a table came from, so an adapter-scoped
  table laid unconditionally by TEST_SCHEMA is distinguishable in the report.
- The unresolved-call-site coverage abort covers the new files too — a
  `create_table` form unique to them must fail loudly, not silently drop.
- `scripts/schema-compare/invented-baseline.json` shrinks if any currently
  baselined entry turns out to be declared in one of these files.
