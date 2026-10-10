---
title: "columns_hash returns Column objects, not the loose ColumnLike record"
status: ready
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ModelSchema.columnsHash` (`packages/activerecord/src/model-schema.ts:169-177`) is typed
`Record<string, ColumnLike>`, where `ColumnLike` is `{ name; type?; sqlType?; default?;
[key: string]: unknown }`. Rails' `columns_hash`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/model_schema.rb:427-430`) returns the
`ConnectionAdapters::Column` objects the schema cache holds, so a caller can ask
`columns_hash["id"].bigint?` or `.null` directly.

Because of the loose type, a caller that needs a `Column` method casts through `unknown`.
trails#8342's `legacyPrimaryKeyTestCases` does
`LegacyPrimaryKey.columnsHash() as unknown as Record<string, Column>` to reach `isBigint()` and
`null` (`packages/activerecord/src/migration/compatibility.test.ts`), mirroring
`compatibility_test.rb:1246-1253`. `packages/activerecord/src/attributes.test.ts` casts the same
call to ad-hoc record shapes.

## Converged shape

`columnsHash()` returns `Record<string, Column>` (`connection-adapters/column.ts`), and the
schema-cache peek it reads (`getCachedColumnsHash`) is typed the same way. A fake test adapter that
feeds plain objects builds real `Column`s instead.

## Acceptance criteria

- [ ] `columnsHash()` and the `_columnsHash` memo are typed `Record<string, Column>`; `ColumnLike`
      is deleted or reduced to the fake-adapter seam that still needs it.
- [ ] The `as unknown as Record<string, Column>` cast in `migration/compatibility.test.ts` and the
      record-shape casts in `attributes.test.ts` are removed.
- [ ] `pnpm typecheck` and `pnpm test:types` pass.
