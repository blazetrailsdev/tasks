---
title: "enumerable-free-functions-remaining-sites"
status: done
updated: 2026-10-26
rfc: "0194-ruby-compat-native-first"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9325
claim: "2026-10-26T14:18:12Z"
assignee: "enumerable-free-functions-remaining-sites"
blocked-by: null
closed-reason: null
---

## Context

trails#9274 added `eachWithObject` and `sortBy` to `packages/ruby-compat/src/enumerable.ts` and converted the `each_slice` / `sort_by` sites plus activerecord's `each_with_object` sites in `where_clause.rb:62`, `predicate_builder.rb:29,164`, `polymorphic_array_value.rb:27`, `join_dependency.rb:16-21`, `preloader/association.rb:170`, `abstract/schema_statements.rb:1511`, `postgresql/schema_statements.rb:947`, `abstract/transaction.rb:280,349`, `has_many_through_association.rb:194`, `sqlite3_adapter.rb:302` and `calculations.rb:567,586`.

These are still hand-rolled (vendor/rails/v8.0.2/activerecord/lib/active_record/):

- `core.rb:289`, `persistence.rb:616` (the receiver may be a plain object, so it needs an entries form), `fixtures.rb:788`, `postgresql_adapter.rb:532`, `postgresql/schema_statements.rb:25` (String memo), `preloader/association.rb:47`, `mysql/database_statements.rb:67`
- `preloader/through_association.rb:12,99` (the block awaits, so it needs an async form) and `calculations.rb:575` (`each_with_object({}).with_index`)
- every `each_with_index` site (43 in Rails lib), and the `sort_by!` sites (`query_logs.rb:177`, `preloader/through_association.rb:33`, `sqlite3_adapter.rb:433`, `abstract_mysql_adapter.rb:489`)
- the `each_with_object` sites outside activerecord (52 total across Rails lib)

## Acceptance criteria

- [ ] Each site above uses the ruby-compat free function (`eachWithObject`, `eachWithIndex`, a bang `sortBy` form), or carries a cited language-forced reason for staying a loop.
- [ ] Any baseline row these conversions make stale is deleted and tightened.
