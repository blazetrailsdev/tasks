---
title: "Type SchemaCache#indexes as adapter index rows instead of unknown[]"
status: done
updated: 2026-08-02
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: 5879
claim: "2026-08-02T12:36:50Z"
assignee: "schema-cache-indexes-drop-unknown-return-type"
blocked-by: null
closed-reason: null
---

## Context

`SchemaCache` still declares `indexes` as `Promise<unknown[]>` in three places
(`packages/activerecord/src/connection-adapters/schema-cache.ts`, search
`async indexes(`), and `packages/trailties/src/schema-source.ts` carries a
separate `IndexInfo` shape. PR #5858 tightened the adapter surface to
`IndexDefinitionRow` but deliberately left these alone to stay in scope.

Rails' `SchemaCache#indexes(pool, table_name)` returns the adapter's
`IndexDefinition` rows unchanged
(`activerecord/lib/active_record/connection_adapters/schema_cache.rb`).

## Acceptance criteria

- `SchemaCache#indexes` (all declarations) returns the same row type the
  adapter does, with no `unknown[]`.
- `trailties` `IndexInfo` either derives from that shape or its divergence is
  justified at the call site.
- `pnpm typecheck` clean; `db schema:cache:dump` coverage in
  `packages/trailties/src/commands/db.test.ts` still passes.
