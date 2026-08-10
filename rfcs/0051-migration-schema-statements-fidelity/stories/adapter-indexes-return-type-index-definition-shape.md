---
title: "Type AbstractAdapter#indexes as IndexDefinition rows instead of unknown[]"
status: done
updated: 2026-08-02
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5858
claim: "2026-08-02T02:46:48Z"
assignee: "adapter-indexes-return-type-index-definition-shape"
blocked-by: null
closed-reason: null
---

## Context

`AbstractAdapter`'s TypeScript interface declares
`indexes(tableName: string): Promise<unknown[]>`
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts:369`),
while the real implementation in
`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:1219`
returns `Array<{ name; columns; unique; where?; orders? }>` — mirroring
Rails' `IndexDefinition` (`activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb`).

Because of the loose declaration, `Migration#indexes`
(`packages/activerecord/src/migration.ts`) has to cast the adapter result back
to the IndexDefinition shape. Tightening the declaration during PR #5851 was
reverted: `BetterSQLite3Adapter` (and callers in `packages/trailties/src/commands/db.test.ts`,
`scripts/sync-stats/sync.ts`) still declare `Promise<unknown[]>`, so the
narrowed interface no longer accepted them.

A related, smaller instance: `addReference`/`removeReference` on the adapter
interface type `options` as `Record<string, unknown>`, forcing an
`as Record<string, unknown>` cast at `Migration#addReference`.

## Acceptance criteria

- `AbstractAdapter.indexes` is declared with the IndexDefinition-shaped return
  type, and concrete adapters (BetterSQLite3 and any other divergent
  implementers) are updated to match.
- The cast in `Migration#indexes` is removed.
- The `as Record<string, unknown>` cast in `Migration#addReference` is removed
  (widen or align the adapter option type instead).
- `pnpm typecheck` clean; `parity:api` / `parity:test` delta non-negative.
