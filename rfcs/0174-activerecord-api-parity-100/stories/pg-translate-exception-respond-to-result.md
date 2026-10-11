---
title: "Converge PostgreSQLAdapter#translate_exception's respond_to?(:result) guard"
status: in-progress
updated: 2026-10-11
rfc: "0174-activerecord-api-parity-100"
cluster: arms
packages: []
deps:
  - pg-driver-errors-carry-a-result-at-the-raw-connection-boundary
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8787
claim: "2026-10-11T17:25:06Z"
assignee: "encryption-configurable-included-block-runs-on-the-module-not-the-includer"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `pnpm parity:api:duck-types` (trails#7979), hand-audited real.
`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:802`:
`return exception unless exception.respond_to?(:result)`, then `exception.result.try(:error_field, PG::PG_DIAG_SQLSTATE)`.
`packages/activerecord/src/connection-adapters/postgresql-adapter.ts:1820-1833` (`translateException`) enumerates
`instanceof pg.DatabaseError` plus two connection-error predicates, and switches on `exception.code` instead of reading the SQLSTATE through `result`.

## Acceptance criteria

- The guard is one duck test for the driver error's result/sqlstate carrier (`rbObjRespondTo` or its driver-boundary equivalent, cited), in Rails' position, with no class list.
- The `case` reads the SQLSTATE the way `:804` does.
- Its row drops out of `pnpm parity:api:duck-types`, and the pg adapter suite stays green.
