---
title: "schema-cache-rehydrate-indexdefinition-on-load"
status: closed
updated: 2026-08-02
rfc: "0061-ci-failures"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5891
claim: null
assignee: null
blocked-by: null
closed-reason: "superseded by #5890, which shipped the same rehydration under schema-cache-rehydrates-indexdefinition-instances"
---

## Context

`SchemaCache#indexes` is typed `Promise<IndexDefinition[]>`
(`packages/activerecord/src/connection-adapters/schema-cache.ts:380`), and the
adapter reflection path does return real `IndexDefinition` instances after
PR #5877. The deserialize paths do not: `initWith` (schema-cache.ts:166) and
`marshalLoad` (schema-cache.ts:641) `Object.entries(...)` the decoded JSON and
cast the bare records to `IndexDefinition[]`. A cache loaded from
`schema_cache.json` / a marshal payload therefore carries the fields but none
of the derived methods (`conciseOptions`, `columnOptions`, `isDefinedFor`), and
the declared type is a lie on that path.

Rails has no such split: `SchemaCache` round-trips through Psych, which
restores real `ActiveRecord::ConnectionAdapters::IndexDefinition` objects, so
`schema_cache.rb`'s `indexes` returns the same objects whether reflected or
loaded. Columns already have the trails equivalent — `rehydrateColumn`
(schema-cache.ts:62) rebuilds `Column` instances from `ColumnJSON` on both
load paths — indexes just never got one.

Noted while fixing #5889 (the #5877/#5879 merge race); left out of that PR to
keep the red-CI unblock minimal.

One trap: `IndexDefinition`'s private `conciseOptions`
(`connection-adapters/abstract/schema-definitions.ts:667`) is NOT guarded
against a non-object argument, unlike the dumper's module-level `conciseOptions`
(`schema-dumper.ts:132`). Serialized `orders`/`opclasses` may already be a
collapsed scalar string, and feeding `"desc"` back into the constructor runs
`Object.values("desc")` → `["d","e","s","c"]`. It happens to survive today only
because the length rarely matches `columns.length`. Re-running the constructor
over serialized values is therefore NOT safely idempotent as written — either
guard the class's `conciseOptions` on `typeof options !== "object"` (matching
the dumper's, and Rails' `concise_options` which only ever sees a Hash) or
expand collapsed scalars back over the columns before constructing, the way
`copyTableIndexes` already does for `add_index`.

## Acceptance criteria

- A `rehydrateIndexDefinition` helper (sibling of `rehydrateColumn`) rebuilds
  `IndexDefinition` instances in both `initWith` and `marshalLoad`.
- The scalar-collapse round-trip is made genuinely idempotent, not
  accidentally so — see the trap above.
- A test asserts a dumped-then-loaded cache returns real `IndexDefinition`
  instances whose collapsed `orders`/`lengths`/`opclasses` survive the round
  trip unchanged, including the expression-index (`columns` is a string) and
  single-column-collapse cases.
- The "Deliberately left as-is here" comment added in #5889 at
  schema-cache.ts:166 is deleted.

## Definition of done

Above criteria met; `pnpm typecheck` clean; `schema-cache.test.ts` and
`packages/trailties/src/commands/db.test.ts` (covers `db schema:cache:dump`)
pass.

## Verification

`pnpm vitest run packages/activerecord/src/connection-adapters/schema-cache.test.ts packages/trailties/src/commands/db.test.ts`
