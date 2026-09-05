---
title: "Schema.define invents an env-resolution chain where Rails reads migration_context.current_environment"
status: draft
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `Schema.define` reads the environment through one call
(`vendor/rails/activerecord/lib/active_record/schema.rb:63`):

```ruby
connection_pool.internal_metadata.create_table_and_set_flags(connection_pool.migration_context.current_environment)
```

and `MigrationContext#current_environment` (`migration.rb:1340-1342`) is
`ActiveRecord::ConnectionHandling::DEFAULT_ENV.call` — nothing else.

`packages/activerecord/src/schema.ts:50-51` invents a four-arm chain instead:

```ts
const currentEnvironment =
  info.environment ?? getEnv("TRAILS_ENV") ?? getEnv("NODE_ENV") ?? DEFAULT_ENV();
```

Three problems, all behavioural rather than cosmetic:

1. **`info[:environment]` does not exist in Rails.** `schema.rb` reads only
   `info[:version]` (`:60`). The extra key silently outranks every environment
   source.
2. **The `TRAILS_ENV` / `NODE_ENV` arms are a duplicate of `DEFAULT_ENV`'s own
   resolution** — `RAILS_ENV` (`connection-handling.ts:562-565`, Rails'
   `connection_handling.rb:6`) already consults both — so the chain re-implements
   the lambda it then falls back to.
3. **The duplicate resolves differently.** `RAILS_ENV` wraps each read in
   `presence(...)`; the bare `getEnv` arms here do not, so an empty-string
   `TRAILS_ENV` wins in `schema.ts` and is skipped everywhere else.

The call also reaches `internalMetadata` directly rather than through
`migrationContext`, so the `current_environment` seam Rails routes through is
absent.

## Converged shape

`define` passes `this.connectionPool.migrationContext.currentEnvironment` to
`createTableAndSetFlags`, matching `schema.rb:63`. The `info.environment` key,
the two `getEnv` arms and the local are deleted; `SchemaDefineInfo` loses
`environment`, leaving `version` as Rails has it.

## Acceptance criteria

- `Schema#define` reads as `schema.rb:55-64`, with `currentEnvironment` reached
  through `migrationContext` and no env resolution of its own.
- `SchemaDefineInfo.environment` is gone; any caller passing it is updated or
  its need is filed separately with the Rails line that justifies it.
- `schema.test.ts` and the migration/internal-metadata suites stay green on all
  three adapters, with no test names changed.
