---
title: "Converge PostgreSQLAdapter#translate_exception's respond_to?(:result) guard"
status: blocked
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-09-30T23:24:46Z"
assignee: "test-case-fixtures-class-method-is-untyped"
blocked-by: "node-pg errors share no class, marker or result carrier: pg/lib/client.js:180,678,685 raise bare Error for connection-level failures (Rails' PG::ConnectionBad, which responds to :result), and only pg-protocol's DatabaseError carries the SQLSTATE (as .code). A single duck test at postgresql_adapter.rb:802's position therefore cannot separate a driver error from any other Error; converging needs the adapter to stamp driver errors with a result carrier at the raw-connection boundary (prepare(), performQuery, connect) first — file that as its own story."
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
