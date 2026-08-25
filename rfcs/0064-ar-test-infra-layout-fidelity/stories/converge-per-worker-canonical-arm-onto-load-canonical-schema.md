---
title: "per-worker boot lays TEST_SCHEMA, forcing loadSchema's canonical-arm parameter"
status: done
updated: 2026-07-30
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 5678
claim: "2026-07-30T21:03:19Z"
assignee: "converge-per-worker-canonical-arm-onto-load-canonical-schema"
blocked-by: null
closed-reason: null
---

## Context

PR #5670 routed the per-worker schema load (`packages/activerecord/src/test-setup-dy.ts`)
through `loadSchema` (`packages/activerecord/src/support/load-schema-helper.ts`),
so both arms of
`vendor/rails/activerecord/test/support/load_schema_helper.rb:4-21` are applied
on every lane. It did so by giving `loadSchema` an optional _canonical arm_: a
thunk the caller passes when it lays `schema.rb`'s mirror by some other
mechanism and returns the connection for the adapter-specific arm.

That parameter is the residual deviation. Rails has one mechanism; trails has
two:

- `loadCanonicalSchema` (`support/canonical-schema.ts`) — the template build
  (`support/template-global-setup.ts`) and the adapter clusters
  (`support/setup-adapter-suite.ts`).
- `generateSchemaFile(TEST_SCHEMA, ...)` +
  `DatabaseTasks.reconstructFromSchema` / `DatabaseTasks.loadSchema`
  (`test-setup-dy.ts:45-80`) — the per-worker DB every ordinary AR test rides.

The second exists because that DB has to be purged/reconstructed first, which
Rails' single-process suite never does. Its side effect is that the boot path
of every ordinary AR test lays the _second_ schema.rb transcription
(`TEST_SCHEMA`), not the registry — the same split
`schema-compare-verifies-the-unused-transcription` describes from the gate side.

If the per-worker path laid the canonical registry directly (purge, then
`loadCanonicalSchema`), the canonical-arm parameter disappears, `loadSchema`
returns to Rails' zero-argument shape, and `TEST_SCHEMA` leaves the boot path
entirely.

## Acceptance criteria

- `test-setup-dy.ts` lays the canonical half through `loadCanonicalSchema`, not
  through a generated schema file, on every lane (sqlite `:memory:`, sqlite
  file, PG/MySQL slot 1, PG/MySQL exclusive slots).
- The purge/reconstruct semantics each lane needs today are preserved —
  including the `schemaUpToDate` fast path that lets a PG worker TRUNCATE
  instead of reloading (see `support/pg-template.test.ts`).
- `loadSchema` loses its canonical-arm parameter and takes an adapter only,
  matching `load_schema_helper.rb`.
- The worker-startup table assertion (canonical tables + `defaults`) still
  passes on every lane.

## Notes

Sized as a boot-path change with adapter-lane risk; verify on the PG and MySQL
lanes, not just sqlite.
