---
title: "Resolve the two assumeMigratedUptoVersion implementations"
status: done
updated: 2026-07-31
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5761
claim: "2026-07-31T21:50:42Z"
assignee: "dedupe-assume-migrated-upto-version-two-implementations"
blocked-by: null
closed-reason: null
---

## Context

trails has **two** implementations of Rails' single
`assume_migrated_upto_version` (`abstract/schema_statements.rb:1364-1383`):

- `SchemaStatements#assumeMigratedUptoVersion`
  (`connection-adapters/abstract/schema-statements.ts:1843`) — the real port,
  pool/`migrationContext`-driven, and the only one with production callers
  (`schema.ts:98`).
- `SchemaMigration#assumeMigratedUptoVersion` (`schema-migration.ts:153`) — a
  trails invention with **no Rails counterpart** (Rails' `SchemaMigration`,
  `schema_migration.rb`, has no such method) and **no in-repo production
  callers**. It takes an explicit `migrationVersions` array in place of the
  migration context.

PR #5483 brought the second one into line with Rails on duplicate-check scope,
`detect`/`count` selection, and the two-statement reversed-backfill write shape,
and added 13 tests. But converging a method that Rails does not have is
treating a symptom: the duplication means every future fidelity fix has to land
twice, and the copy carries a deliberate documented divergence of its own
(it validates fully before any write, where Rails writes the target version
first — `schema-migration.ts:146-151`).

## Acceptance criteria

- [ ] Decide whether `SchemaMigration#assumeMigratedUptoVersion` should be
      deleted outright, or kept and justified as extra surface.
- [ ] If deleted: confirm no callers (currently none in `packages/*/src`),
      remove the method and its trails test file, and confirm the parity:api
      extra-surface count drops.
- [ ] If kept: record why at the call site, and note that the
      validate-before-write divergence is deliberate.
- [ ] Do not allowlist it as extra surface without converging — see the
      standing rule that the allowlist is not for deferred work.
- [ ] parity:api / parity:test delta non-negative.
