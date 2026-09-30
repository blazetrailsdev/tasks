---
title: "Port the active_record.define_attribute_methods initializer and SchemaReflection#cached?"
status: draft
updated: 2026-09-30
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties", "activerecord"]
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

Rails' AR railtie declares `initializer "active_record.define_attribute_methods"`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/railtie.rb:145-185`).
In `config.after_initialize` + `on_load(:active_record)`, when
`!check_schema_cache_dump_version && app.config.eager_load && !Rails.env.local?`
(`:169`), it walks `descendants`, and for each model whose
`connection_pool.schema_reflection.cached?(model.table_name)`
(`connection_adapters/schema_cache.rb:79-89`, `:173-175`) it calls
`model.define_attribute_methods`. It rescues `ActiveRecordError` with
`warn "Failed to define attribute methods because of #{error.class}: #{error.message}"`.

trails' `packages/trailties/src/trailties/active-record.ts` has no such
initializer, and `SchemaReflection` / `BoundSchemaReflection`
(`packages/activerecord/src/connection-adapters/schema-cache.ts`) have no
`cached?` (`isCached`). trails#8258 put a separate await-able warm in
`initialize_database`. That warm does not replace this initializer: it is
unconditional and pool-wide, while this one is Rails' eager, dump-backed arm.

## Acceptance criteria

- [ ] `SchemaReflection#isCached(tableName)` and
      `BoundSchemaReflection#isCached(tableName)` are ported from
      `schema_cache.rb:79-89,173-175`, including the
      `check_schema_cache_dump_version` load-without-connecting arm.
- [ ] `active_record.define_attribute_methods` is declared at Rails' position
      (after `active_record.copy_schema_cache_config`), with the `:169` guard,
      the `descendants` walk, `defineAttributeMethods`, and the rescue and warn
      text verbatim.
- [ ] Tests mirror the railties coverage of the initializer.
