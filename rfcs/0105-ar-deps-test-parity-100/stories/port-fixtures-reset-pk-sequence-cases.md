---
title: "port-fixtures-reset-pk-sequence-cases"
status: draft
updated: 2026-09-09
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`FixturesResetPkSequenceTest`
(`vendor/rails/activerecord/test/cases/fixtures_test.rb:707-752`) is gated by
Rails itself on `Account.lease_connection.respond_to?(:reset_pk_sequence!)`
(`:715`), which is true on PostgreSQL only. Its three cases assert that
`reset_pk_sequence!` returns a table's sequence to `MAX(id) + 1` — with an
explicit pk and sequence name, with the defaults, and after `create_fixtures`
when the set is not cached.

trails already exposes the method: `resetPkSequenceBang` at
`packages/activerecord/src/connection-adapters/postgresql/schema-statements.ts:1402`,
called from `insertPreparedFixtureSets` (`fixtures.ts:438-442`). #7652 excluded
all three anyway; the adapter gate is the port, not the exclusion.

## Converged shape

- The three cases are ported under `describe("FixturesResetPkSequenceTest")`,
  wrapped in the trails spelling of Rails' `respond_to?` gate —
  `currentAdapter("PostgreSQLAdapter")` via `support/adapter-helper.ts`, the same
  shape `raises fk violations` already uses in this file.
- They exercise `resetPkSequenceBang` directly, with and without the explicit
  `primaryKey` / `sequenceName` arguments, mirroring `:723` and `:734`.
- The exclusion row is DELETED from `scripts/parity/unported-files/unscoped.ts`.

## Acceptance criteria

- The three cases exist at their derived Rails names, pass on the PG lane, and
  are gated (not skipped) elsewhere, so `skipped` stays 0.
- Their row is gone from `unscoped.ts` and `fixtures_test.rb` matches up by three.
