---
title: "P3 — PG array and misc adapter (17 skips)"
status: ready
updated: 2026-06-08
rfc: "0000-ar-test-compare-100"
cluster: adapter
deps: ["i1-schema-dumper-columnspec-u3"]
deps-rfc: []
est-loc: 200
priority: 12
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Catches the remaining PG adapter skips that don't belong to the transaction, referential-
integrity, or optimizer-hints/enum families. Mirrors the corresponding Rails files under
`test/cases/adapters/postgresql/`.

**array.test.ts (4):** `change column cant make non array column to array`,
`mutate value in array`, `datetime with timezone awareness`, `precision is respected on
timestamp columns`.

**uuid.test.ts (2):** `schema dumper for uuid primary key default in legacy migration`,
`schema dumper for uuid primary key with default nil in legacy migration`.

**quoting.test.ts (2):** `quote rational`, `quote binary`.

**hstore.test.ts (2):** `hstore migration`, `supports to unsafe h values`.

**virtual-column.test.ts (1):** one generated-column test.

**timestamp.test.ts (1):** one timestamp precision/timezone test.

**schema.test.ts (1 hard skip):** `schema change with prepared stmt`. The file also
contains 2 `it.skipIf(!pgSupportsNativePartitioning)` tests for list/range partition
options — these are conditional guards (not permanent skips) and should be left as
`skipIf` once the underlying gap is fixed.

**invertible-migration.test.ts (1):** one invertible-migration test.

**infinity.test.ts (1):** one infinity-value boundary test.

**foreign-table.test.ts (1):** one foreign-table schema test.

**bytea.test.ts (1):** one bytea round-trip test.

All 17 hard skips are standard Rails-mirrored tests.

Local-verify-only until RFC 0012 `wire-adapter-dir-lane` adds the CI lane.
Run: `TEST_ADAPTER=postgresql PG_TEST_URL=… pnpm vitest run <file>`.

## Acceptance criteria

- [ ] All 4 skips in `postgresql/array.test.ts` un-skipped and passing.
- [ ] Both skips in `postgresql/uuid.test.ts` un-skipped and passing.
- [ ] Both skips in `postgresql/quoting.test.ts` un-skipped and passing.
- [ ] Both skips in `postgresql/hstore.test.ts` un-skipped and passing.
- [ ] Single skip in each of `virtual-column`, `timestamp`, `invertible-migration`,
      `infinity`, `foreign-table`, `bytea` un-skipped and passing.
- [ ] The 1 hard `it.skip` in `schema.test.ts` un-skipped and passing; the 2
      `skipIf(!pgSupportsNativePartitioning)` guards left as conditional (not converted to
      permanent skips).
- [ ] No regressions in the broader PG adapter test suite.
- [ ] CI-gated once RFC 0012 `wire-adapter-dir-lane` merges.

## Notes

This is the widest story by file count; if a single file proves unexpectedly complex,
consider splitting it into its own follow-on PR rather than blocking the whole batch.

The `hstore` file also has a YAML-serialization skip that H-3 moved to `unported-files`;
verify it is already reclassified before un-skipping to avoid double-counting.

Rails source: spread across `postgresql/oid/`, `postgresql/schema_dumper.rb`,
`postgresql/database_statements.rb`. The partition `skipIf` tests in `schema.test.ts`
require PG 10+ native partitioning support in the test server.
