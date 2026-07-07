---
title: "Scope SchemaDumperAdapterTest dumps to own tables (drop 60s timeout band-aid)"
status: in-progress
updated: 2026-07-07
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 72
pr: 4761
claim: "2026-07-07T22:59:23Z"
assignee: "scope-schema-dumper-adapter-test-dumps"
blocked-by: null
closed-reason: null
---

## Context

`SchemaDumperAdapterTest` in `packages/activerecord/src/schema-dumper.trails.test.ts`
(describe block at :186) rides the full canonical schema on `Base.connection`
via `fixtures({}, { useTransactionalTests: false })`. Its adapter-introspection
cases call `TopLevelDumper.dump(adapter)` / `dumpWithVersion(adapter)`, which
introspect and emit **all ~200 canonical tables** even though each test only
builds one table (`horses`, `testings`, `octopi`, `barcodes`). Under 6-worker
PG fork load this repeatedly blew vitest's 5s default — a long-standing flake.

PR #4628 stabilized it with a band-aid: a `60000ms` per-test timeout on the
seven full-DB-dump cases (matching the #4250 precedent), plus a
`deleteAllVersions()` hermeticity fix for the version test. This works but does
not remove the underlying full-DB introspection cost.

The sibling story `scope-full-schema-dump-tests-off-empty-db` (PR #4547) already
introduced the clean pattern — `dumpTableSchema(source, ...ownTables)` scoping so
a test only introspects the tables it built — and applied it to
`schema-dumper.test.ts` and audited `comment`/`date-time-precision`/
`time-precision`. It did **not** cover `schema-dumper.trails.test.ts`.

## Acceptance criteria

- Convert the scopeable `SchemaDumperAdapterTest` cases (`dumps schema from
adapter introspection`, `dumps schema with indexes from adapter`, the
  `precision: null` datetime case, and the string-limit case) to a scoped
  `dumpTableSchema(source, ...ownTables)` dump so they introspect only their
  own table, and remove the `60000ms` timeout band-aid from those.
- Leave `skips internal tables when dumping from adapter` as a full-DB dump —
  its assertions (`not.toContain("schema_migrations")` /
  `not.toContain("ar_internal_metadata")`) are precisely testing full-DB
  internal-table filtering, so scoping would change what it proves; keep its
  timeout headroom.
- Keep all existing assertions intact; do not rename any tests.
- Verify green on PG locally for the touched file.
