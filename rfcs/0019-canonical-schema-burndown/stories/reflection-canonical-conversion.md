---
title: "reflection-canonical-conversion"
status: ready
updated: 2026-06-27
rfc: "0019-canonical-schema-burndown"
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

`packages/activerecord/src/reflection.test.ts` remains in `eslint/require-canonical-schema-exclude.json` after the inheritance-modules-reflection-followup PR (#4212). The file uses 100+ bespoke table definitions via `defineSchema()` for the reflection test suite.

The file was reviewed and an `eslint-disable` wrapper was rejected. Proper canonicalization requires:

1. Scope-chain tests (`sc_hotels`, `sc_depts`, `sc_rooms`, `sc_bookings`) that DO write to the DB — these tables need to be added to `TEST_SCHEMA` or the tests rewritten to use canonical tables
2. Column-reflection tests use non-canonical table names but only check synthesized schema — these may not need DB tables
3. The polymorphic/through-association reflection tests use canonical tables already, but wrapped in bespoke `defineSchema` calls

The file is ~1500 lines and will require careful analysis before conversion.

Rails source: `vendor/rails/activerecord/test/cases/reflection_test.rb`

## Acceptance criteria

- `reflection.test.ts` is removed from `eslint/require-canonical-schema-exclude.json`
- All `defineSchema()` calls are replaced with `useHandlerFixtures()` on canonical tables
- Tests that require non-canonical tables (sc_hotels, etc.) either use canonical equivalents or have proper `TEST_SCHEMA` entries added
- All tests pass (or are properly skipped with PERMANENT-SKIP / TRACKED-PENDING-CONVERGENCE)
- No `eslint-disable` wrappers
