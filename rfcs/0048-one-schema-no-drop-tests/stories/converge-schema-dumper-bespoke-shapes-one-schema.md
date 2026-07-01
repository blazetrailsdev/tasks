---
title: "converge-schema-dumper-bespoke-shapes-one-schema"
status: ready
updated: 2026-07-01
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`packages/activerecord/src/schema-dumper.test.ts` is on
`eslint/one-schema-exclude.json`. PR #4366
(`converge-schema-dump-introspect-one-schema`) converged only the
standard_dump subset; the file still fails under `AR_ONE_SCHEMA=1`. Verified
2026-07-01 on the merged one-schema branch: 9 failing tests under the flag.

The failing tests dump schema for bespoke shapes that the canonical schema does
not contain (expression indices, `nulls not distinct`, index sort order,
large-precision decimal columns, `id: false` + unique-not-null column, text
column defaults, regexp-ignored table). Under one-schema `defineSchema` no-ops
and the bespoke table/column/index the assertion expects is never created, so
the dump doesn't match. Rails' `schema_dumper_test.rb` builds these shapes with
its own `create_table`/`add_index` against scratch tables inside the test.

Follow Rails fidelity (RFC 0048 respec / RFC 0019 style): port each case to
create its own scratch table+indexes within the test (force real DDL, dropped in
teardown) so it never depends on canonical no-op, OR route this file to a
dedicated DDL lane that runs flag-off. Do NOT rename tests. Read the
corresponding Rails `activerecord/test/cases/schema_dumper_test.rb` cases first.
Note: some of these (expression indices, nulls-not-distinct, index sort order)
are PG/adapter-specific — confirm the canonical schema genuinely lacks them
before adding scratch shapes.

## Acceptance criteria

- `AR_ONE_SCHEMA=1 pnpm vitest run packages/activerecord/src/schema-dumper.test.ts` passes.
- These 9 tests pass under the flag (names unchanged):
  - SchemaDumperTest > schema dump expression indices
  - SchemaDumperTest > schema dump expression indices escaping
  - SchemaDumperTest > schema dumps nulls not distinct
  - SchemaDumperTest > schema dumps index sort order
  - SchemaDumperTest > schema dump includes decimal options
  - SchemaDumperTest > schema dump keeps large precision integer columns as decimal
  - SchemaDumperTest > schema dump keeps id false when id is false and unique not null column added
  - SchemaDumperTest > schema dump with regexp ignored table
  - SchemaDumperDefaultsTest > schema dump with text column
- `schema-dumper.test.ts` removed from `eslint/one-schema-exclude.json`.
- No test renames; bespoke shapes built via per-test scratch DDL (no canonical reshape).
