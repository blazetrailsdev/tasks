---
title: "activerecord: SQLite3 SchemaDumper#virtual_tables guards a connection Rails reads directly"
status: closed
updated: 2026-10-11
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Delivered by trails#8715 (8531daa85f, SchemaDumper reads its connection directly): on origin/main @ 11d3346c83 sqlite3/schema-dumper.ts#virtualTables reads 'await this.connection.virtualTables()' with no existence guard and no _adapter() call, and keeps the single 'if (virtualTables.length > 0)' arm around the sorted loop."
---

## Context

Surfaced by trails#8398. Rails (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3/schema_dumper.rb:8-19`):

```ruby
def virtual_tables(stream)
  virtual_tables = @connection.virtual_tables
  if virtual_tables.any?
    stream.puts
    ...
    virtual_tables.sort.each do |table_name, options|
      ...
    end
  end
end
```

`packages/activerecord/src/connection-adapters/sqlite3/schema-dumper.ts#virtualTables` opens with a guard Rails does not have, `if (!connection || typeof connection.virtualTables !== "function") return;`, reads the connection through `this._adapter()`, and inverts `if virtual_tables.any?` into an early `return`. trails#8398 added a `sorted` local so the method can return what `sort.each` returns.

The PostgreSQL twin is `pg-schema-dumper-reads-its-connection-without-any-typed-guards`.

## Acceptance criteria

- [ ] The body reads `this.connection.virtualTables()` with no existence guard and keeps Rails' single `if (isAny(virtualTables))` arm.
- [ ] It still returns the sorted list, or nothing when there are no virtual tables.
