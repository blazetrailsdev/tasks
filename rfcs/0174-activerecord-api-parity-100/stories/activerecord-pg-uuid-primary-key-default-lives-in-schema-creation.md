---
title: "postgresql: the uuid primary-key default is synthesized in add_column_options! instead of ColumnMethods#primary_key"
status: draft
updated: 2026-10-02
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`options-key-mismatches.json` reports one activerecord pair once the axis measures the keys a TS body
reads: `add_column_options!` in `connection_adapters/postgresql/schema_creation.rb`, `extraInTs:
["default", "primaryKey"]`.

Rails' body (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/schema_creation.rb:123-141`)
reads `:collation`, `:as`, `:stored` and `:column`, then calls `super`. The port
(`packages/activerecord/src/connection-adapters/postgresql/schema-creation.ts:171-194`) adds an arm
Rails does not have:

```ts
if (col?.type === "uuid" && opts["primaryKey"] && !("default" in opts)) {
  sql += " DEFAULT gen_random_uuid()";
}
```

Rails sets that default where the column is declared, in `PostgreSQL::ColumnMethods#primary_key`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/schema_definitions.rb:48-54`):

```ruby
def primary_key(name, type = :primary_key, **options)
  if type == :uuid
    options[:default] = options.fetch(:default, "gen_random_uuid()")
  end

  super
end
```

`packages/activerecord/src/connection-adapters/postgresql/schema-definitions.ts` has no `primaryKey`
override on its `ColumnMethods`, so the default is synthesized at SQL-generation time instead. The two
differ observably: Rails' column definition carries `default: "gen_random_uuid()"` (visible to
`create_table id: :uuid` callers and to anything reading the definition), and an explicit
`default: nil` suppresses it through `fetch`, which the port's `"default" in opts` arm also honors but
at a different layer.

## Acceptance criteria

- [ ] `PostgreSQL::ColumnMethods#primaryKey` is ported at `schema_definitions.rb:48-54`, with Rails' `fetch` semantics (a stored `nil` default is kept).
- [ ] The `gen_random_uuid()` arm is deleted from `addColumnOptionsBang` in `postgresql/schema-creation.ts`, leaving the body line-for-line with `schema_creation.rb:123-141`.
- [ ] `pnpm parity:api` reports 0 activerecord pairs in `options-key-mismatches.json`.
- [ ] `adapters/postgresql/uuid.test.ts`, `migration.test.ts` and `schema-dumper.test.ts` stay green on the PostgreSQL lane.

## Verification

```bash
pnpm parity:api && jq '[.mismatches[] | select(.package == "activerecord")] | length' scripts/api-compare/output/options-key-mismatches.json
```
