---
title: "column-deduplicated-drops-the-string-dedup-arms"
status: draft
updated: 2026-10-01
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Column#deduplicated`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/column.rb:104-112`)
deduplicates every String ivar under its own guard and then calls `super`:

```ruby
@name = -name
@sql_type_metadata = sql_type_metadata.deduplicate if sql_type_metadata
@default = -default if default
@default_function = -default_function if default_function
@collation = -collation if collation
@comment = -comment if comment
super
```

trails' `deduplicated` (`packages/activerecord/src/connection-adapters/column.ts:108-113`)
keeps only the `sqlTypeMetadata` arm and ends with `Object.freeze(this)` in place of
`super`. `pnpm parity:api:arms:report --package=activerecord --direction=missing` reports
it as `-if -if -if -if`.

The four dropped arms all go through `String#-@`
(`vendor/ruby/v3.3.11/string.c:3059` `str_uminus`), which `@blazetrails/ruby-compat` does not
export, and the `super` is `Deduplicable#deduplicated`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/deduplicable.rb:24`),
which `activerecord-deduplicable-deduplicated-and-unary-minus` gives a real body. This story
is the `Column` half that story's acceptance criteria do not name.

## Acceptance criteria

- [ ] `Column#deduplicated` carries Rails' five guarded assignments in Rails' order and
      reaches `Deduplicable#deduplicated` for the freeze.
- [ ] `String#-@` has a ruby-compat spelling with its MRI citation, used at all five sites.
- [ ] The arms report has no `column.ts#deduplicated` row.
