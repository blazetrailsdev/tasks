---
title: "converge-activerecord-dropped-block-arms-remainder"
status: draft
updated: 2026-09-25
rfc: "0156-parity-beyond-name-presence"
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

Remainder of `converge-activerecord-dropped-block-arms`. That PR converged 15 of the
25 activerecord rows `pnpm parity:api:blocks` flagged (find / select / with,
generates*token_for, HashLookupTypeMap#fetch, the DatabaseTasks `each*\*`iterators, Relation#load → exec_queries → instantiate_records, AssociationRelation#exec_queries,
StatementCache#execute). The activerecord mark in`scripts/api-compare/block-param-mark.json`
is now 10. These rows remain. Each one needs a bigger refactor than a trailing block parameter:

- `relation/batches.rb:379` `batch_on_loaded_relation` and `:426` `batch_on_unloaded_relation`
  yield per batch. trails' `relation/batches.ts` ports them as an array return and an
  `async function*` generator.
- `core.rb:508` `init_with_attributes(attributes, new_record = false)` does `yield self if block_given?`
  and then runs the find/initialize callbacks. trails' `core.ts` `initWithAttributes` only
  sets `_newRecord` / `_attributes`: no `init_internals`, no block, no callbacks.
- `attribute_methods/read.rb:29,38` `read_attribute` / `_read_attribute(attr_name, &block)`
  (reported against `base.rb`).
- `log_subscriber.rb:113` `debug(progname = nil, &block)`. trails spells it `debugSql` in `log-subscriber.ts`.
- `connection_adapters/abstract/database_statements.rb:589` `internal_execute(..., &block)`.
- `connection_adapters/postgresql_adapter.rb:875` `load_types_queries(initializer, oids)`, which yields each query.
- `associations/has_one_through_association.rb` `transaction`, inherited via `collection_association.rb:321` `transaction(&block)`.
- `schema.rb:49` `define(info = {}, &block)`. The TS port already takes a function
  (`schema.ts` `defineClassMethod`), but it is declared as `declare static define: DefineClassMethod`,
  which the extractor does not see as a function-typed parameter. This row may be an extractor gap, not a port gap.

## Acceptance criteria

- Each row above either takes Rails' block as a trailing function parameter with the block arm's
  control flow ported, or is shown to be an extractor gap and fixed in `scripts/api-compare`.
- `pnpm parity:api:blocks:tighten` narrows the activerecord mark to match.
