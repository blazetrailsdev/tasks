---
title: "converge-schema-dumper-test-faithful-port"
status: ready
updated: 2026-06-30
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

Split out from `converge-schema-dump-introspect-one-schema` (PR for the
introspection file shipped separately). Per the RFC 0048 **Convergence
contract**, `packages/activerecord/src/schema-dumper.test.ts` must be a faithful
word-for-word port of `vendor/rails/activerecord/test/cases/schema_dumper_test.rb`.

Current state (audited 2026-06-30): the trails file (1423 LOC) _already_ mirrors
most of Rails' `SchemaDumperTest` + `SchemaDumperDefaultsTest` with verbatim test
names, but appends ~6 bespoke trails-only `describe` blocks that unit-test real
trails-invented exported helpers with **no Rails counterpart**:
`SchemaDumperAdapterTest`, `SchemaDumper async header ordering`,
`cleanRawPgExpression`, `cleanDefault`, `formatColspecRaw`, and the `indexParts*`
cases (plus a few `schema dump round-trips …`/`emits defaultFunction` cases).

This is a half-renamed hybrid, which the contract forbids (rule 5: all-or-nothing
per file, never a half-renamed hybrid).

## Acceptance criteria

- [ ] Relocate the genuine trails-internal helper unit tests (`cleanDefault`,
      `cleanRawPgExpression`, `formatColspecRaw`, `indexParts*`,
      `SchemaDumperAdapterTest`, async-header-ordering, the bespoke round-trip
      cases) into `schema-dumper.trails.test.ts` (the established `.trails.test.ts`
      convention for trails-only tests with no Rails 1:1).
- [ ] Leave `schema-dumper.test.ts` as a pure faithful port of
      `schema_dumper_test.rb`: only `SchemaDumperTest` + `SchemaDumperDefaultsTest`
      with Rails-verbatim test names + assertions; ride canonical `TEST_SCHEMA` + official models + real fixtures only (no bespoke tables/columns, no
      `_tableName` hack).
- [ ] Confirm each retained case against the Rails source; where a faithful port
      surfaces an impl gap, fix the impl or file a deviation under
      `0023-surfaced-deviations` (tracked-pending-convergence). A temporary
      `test:compare` regression is acceptable.
- [ ] 500-LOC ceiling; single PR from main.
