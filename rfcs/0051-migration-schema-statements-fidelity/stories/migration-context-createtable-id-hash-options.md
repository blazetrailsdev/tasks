---
title: "widen MigrationContext.createTable id option to accept IdHashOptions (string-typed PK)"
status: claimed
updated: 2026-07-04
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: "2026-07-04T18:40:17Z"
assignee: "migration-context-createtable-id-hash-options"
blocked-by: null
---

## Context

`disable-joins-polymorphic-nonid-pk.test.ts` (PR #4208) creates tables with string-typed PK columns (`uuid`, `slug`) using `id: { type: "string" }` (the `IdHashOptions` hash form). At runtime `TableDefinition` handles this correctly via `schema-definitions.ts:840-854`. However `MigrationContext.createTable`'s TypeScript overload only exposes `id?: boolean | "uuid"`, not `IdHashOptions`:

```ts
// packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:177
id?: boolean | "uuid";
```

The `IdHashOptions` form (`id?: boolean | "uuid" | IdHashOptions`) is present on the inner overloads (lines 239, 256) but not on the public-facing type. This forced `Base.connection as any` bypass in the test.

Rails: `create_table "dp_non_id_photos", primary_key: "uuid", id: :string` — the `id:` option accepts a Symbol/type hash natively.

## Acceptance criteria

- `MigrationContext.createTable` (and the public `SchemaStatements#createTable` overload) accepts `id?: boolean | "uuid" | IdHashOptions`
- `Base.connection as any` bypass in `disable-joins-polymorphic-nonid-pk.test.ts` replaced with typed call
- No `as any` required for non-auto-increment string PK tables
