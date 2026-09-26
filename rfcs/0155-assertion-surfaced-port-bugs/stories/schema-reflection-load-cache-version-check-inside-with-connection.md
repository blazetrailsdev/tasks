---
title: "SchemaReflection#loadCache compares schemaVersion outside with_connection instead of new_cache.version(connection)"
status: done
updated: 2026-09-26
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#8130
claim: "2026-09-26T02:17:05Z"
assignee: "mapper-drops-its-own-routes-buffer"
blocked-by: null
closed-reason: null
---

## Context

`SchemaReflection#load_cache` (`vendor/rails/activerecord/lib/active_record/connection_adapters/schema_cache.rb:116-140`) is:

```ruby
pool.with_connection do |connection|
  current_version = connection.schema_version
  if new_cache.version(connection) != current_version
    warn "Ignoring #{@cache_path} because it has expired. The current schema version is #{current_version}, but the one in the schema cache file is #{new_cache.schema_version}."
    return
  end
end
```

trails (`packages/activerecord/src/connection-adapters/schema-cache.ts`, `loadCache`) diverges in three ways:

- It compares `newCache.schemaVersion` rather than calling `newCache.version(connection)`.
- The comparison runs outside `pool.withConnection`.
- It reports through `console.warn` (split across string concatenations) rather than Ruby's `Kernel#warn` seat.

trails#8104 already converged the `rescue ActiveRecordError` arm and the unconditional `pool.with_connection`.

## Acceptance criteria

- The version check runs inside the `pool.withConnection` block and calls `newCache.version(connection)`, as `:125-131` does.
- The warning goes through the repo's `Kernel#warn` port if one exists, and otherwise stays `console.warn`, with the message text matching Rails'.
