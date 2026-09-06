---
title: "converge-pg-native-types-and-instance-type-map-onto-adapter"
status: in-progress
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 7546
claim: "2026-09-05T23:56:22Z"
assignee: "converge-pg-native-types-and-instance-type-map-onto-adapter"
blocked-by: null
closed-reason: null
---

## Context

Two PostgreSQL type/native-type entry points live as free functions in files of
their own where Rails has them as methods on `PostgreSQLAdapter`.

`postgresqlNativeDatabaseTypes(datetimeType, overrides)` in
`packages/activerecord/src/connection-adapters/abstract/native-database-types.ts`
is `PostgreSQLAdapter.native_database_types`
(`activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:404-410`):

```ruby
def self.native_database_types # :nodoc:
  @native_database_types ||= begin
    types = NATIVE_DATABASE_TYPES.dup
    types[:datetime] = types[datetime_type]
    types
  end
end
```

Rails reads `datetime_type` off the `class_attribute`
(`postgresql_adapter.rb:123`) and memoizes; the trails helper takes it as a
parameter, adds an `overrides` parameter Rails does not have, and sits in a file
shared with the SQLite and MySQL `NATIVE_DATABASE_TYPES` tables — which in Rails
are constants on their own adapter classes.

`initializeInstanceTypeMap(m, defaultTimezone)` in
`connection-adapters/postgresql/type-map-init.ts` is the PRIVATE INSTANCE
`initialize_type_map(m = type_map)` (`postgresql_adapter.rb:744-751`), renamed
because the module already exports the class-level `initializeTypeMap`
(`:676`). Rails keeps both names because one is a class method and one an
instance method; TS collides them only because both were made module functions.
It also reads `@default_timezone` off the adapter rather than taking it as a
parameter, and drops the `load_additional_types` call the Ruby body ends with.

Both carry `@noRailsEquivalent CONVERGEABLE` receipts pointing here (RFC 0130,
`receipt-connection-adapters-and-sqlite-drivers`).

## Acceptance criteria

- `nativeDatabaseTypes` is a static on `PostgreSQLAdapter` reading the
  `datetimeType` class attribute and memoizing, with `NATIVE_DATABASE_TYPES` a
  constant on the adapter class; the `overrides` parameter is gone.
- The instance `initializeTypeMap` is a private instance method on
  `PostgreSQLAdapter` at the Rails name, reading `@defaultTimezone`, and calls
  `loadAdditionalTypes` as `postgresql_adapter.rb:750` does.
- Both receipts are deleted with the helpers.
- `pnpm parity:api:calls` / `:args` show no new rows; the PostgreSQL lane stays
  green.
