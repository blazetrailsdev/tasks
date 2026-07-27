---
title: "Build create_database's option string by iterating merged options as Rails does"
status: ready
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
cluster: null
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

Surfaced while shipping #5410 (`converge-pg-session-and-transaction-exec-primitive-routing`,
RFC 0072). That PR routed `create_database` through the `execute` primitive but
left the option-string construction alone; the `merge!` and `symbolize_keys`
entries for `create_database` are still baselined in
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/connection-adapters/postgresql-adapter.json`
under the generic RFC 0047 seed reason.

Rails (`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb:22-51`):

```ruby
def create_database(name, options = {})
  options = { encoding: "utf8" }.merge!(options.symbolize_keys)

  option_string = options.each_with_object(+"") do |(key, value), memo|
    memo << case key
            when :owner    then " OWNER = \"#{value}\""
            when :template then " TEMPLATE = \"#{value}\""
            when :encoding then " ENCODING = '#{value}'"
            when :collation then " LC_COLLATE = '#{value}'"
            when :ctype    then " LC_CTYPE = '#{value}'"
            ...
```

trails (`packages/activerecord/src/connection-adapters/postgresql/schema-statements-class.ts`,
`createDatabase`) builds the same string from a fixed `if` chain over a typed
`CreateDatabaseOptions`. Two consequences:

1. Rails iterates the _merged options hash_, so an unrecognised key still
   reaches the `else` arm; trails' fixed chain silently drops anything not in
   `CreateDatabaseOptions`.
2. Rails emits `OWNER = "value"` / `TEMPLATE = "value"` by raw double-quote
   interpolation; trails calls `quoteIdentifier(...)`. These agree for ordinary
   names but diverge on embedded quotes.

trails also adds a `connectionLimit` validation (`ArgumentError` for a
non-integer / < -1) that Rails does not have — check whether that is wanted
before preserving it.

## Acceptance criteria

- `createDatabase` builds its option string by iterating the merged options,
  matching Rails' key dispatch and quoting, so unknown keys are not silently
  dropped.
- The `create_database merge!` and `create_database symbolize_keys` entries
  drop out of the wide baseline, or get a specific reason naming the equivalent
  path (not the generic RFC 0047 seed text).
- `pnpm api:calls:wide` passes with a strictly smaller baseline.
- Tests named verbatim after the Rails tests in
  `vendor/rails/activerecord/test/cases/adapters/postgresql/active_schema_test.rb`
  (`test_create_database_with_encoding` and neighbours).
