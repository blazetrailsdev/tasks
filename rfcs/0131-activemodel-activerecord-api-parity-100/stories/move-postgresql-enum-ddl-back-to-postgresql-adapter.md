---
title: "Move the PostgreSQL enum DDL and column_definitions off postgresql/schema-statements.ts back onto the adapter file Rails defines them in"
status: claimed
updated: 2026-09-03
rfc: "0131-activemodel-activerecord-api-parity-100"
cluster: null
packages:
  - activerecord
deps:
  - "move-postgresql-database-statements-to-their-rails-file"
deps-rfc: []
est-loc: 300
priority: 2
pr: null
claim: "2026-09-03T00:39:59Z"
assignee: "move-postgresql-enum-ddl-back-to-postgresql-adapter"
blocked-by: null
closed-reason: null
---

## Context

The mirror image of `move-postgresql-database-statements-to-their-rails-file`:
seven members Rails defines in `postgresql_adapter.rb` that trails put in
`postgresql/schema_statements`'s TS file.

Rails —
`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb`:
`enum_types` `:518`, `create_enum` `:541`, `drop_enum` `:571`, `rename_enum`
`:579`, `add_enum_value`, `rename_enum_value` `:606`, and the private
`column_definitions` `:1034`.

trails — `packages/activerecord/src/connection-adapters/postgresql/schema-statements.ts:1270`
onward, with bodyless signatures left on the adapter
(`postgresql-adapter.ts:2697`). The file scores 239/246, all seven
declaration-only.

Bucket B, a move. Ordered after the database-statements story because both
edit `postgresql-adapter.ts` and a parallel pair would conflict there.

`column_definitions` is private in Rails, so its TS counterpart must carry
`@internal` — `blazetrails/rails-private-jsdoc` will require it once the member
lands in the file the manifest keys on.

## Acceptance criteria

- The seven members live in
  `connection-adapters/postgresql-adapter.ts` with their Rails names,
  parameter names and parameter order, and the signatures they leave behind in
  `postgresql/schema-statements.ts` are deleted rather than kept as a seam.
- `columnDefinitions` carries `@internal`; `pnpm lint` is clean without
  `--fix` having to add it.
- activerecord `connection_adapters/postgresql_adapter.rb` reaches **246/246**;
  package total rises by 7.
- `pnpm parity:api:calls`, `:calls:args`, `:params` clean; no new baseline row.
- The PG lane passes.

## Definition of done

Leaving the bodyless signatures in `postgresql/schema-statements.ts` alongside the moved bodies does not close this story — that is the declaration-only shape this RFC exists to remove.

## Verification

```sh
pnpm build
API_COMPARE_FORCE=1 pnpm parity:api --package activerecord
pnpm parity:api:calls
pnpm parity:api:calls:args
pnpm parity:api:params
pnpm lint
pnpm vitest run packages/activerecord/src/connection-adapters/postgresql
```

`pnpm lint` must pass without `--fix` supplying `@internal` on
`columnDefinitions`.
