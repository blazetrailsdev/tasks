---
title: "defineColumnMethods shares one options object across names; MySQL newColumnDefinition mutates it and checks branches out of order"
status: draft
updated: 2026-09-24
rfc: "0082-ruby-ts-idiom-conversion-classes"
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

Ruby kwargs are copied at every call boundary. In the generated column method
(`activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb:335-337`),
`def #{column_type}(*names, **options)` does
`names.each { |name| column(name, :#{column_type}, **options) }`, and each
`**options` splat hands `column` → `new_column_definition(name, type, **options)` a
fresh Hash. So when MySQL's override mutates its options
(`mysql/schema_definitions.rb:66-80`: `options[:limit] ||= 8`,
`options[:primary_key] = true`, `options[:unsigned] = true`), the change never reaches
the caller's hash or the next name's options.

trails' `TableDefinition.defineColumnMethods`
(`packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts`, the
static beside `timestamps`) pops ONE options object and passes that same object to
`this.column(...)` for every name. MySQL `TableDefinition#newColumnDefinition`
(`packages/activerecord/src/connection-adapters/mysql/schema-definitions.ts`) then
mutates it in place through `(options as any).unsigned = true` /
`.limit ??= 8` / `.primaryKey = true`. So `t.unsignedInteger("a", "b", opts)` writes
`unsigned: true` into the caller's `opts` object, and every later name sees it.
Today the values are idempotent, so nothing observable breaks, but it is the
kwargs-copy idiom trap in CLAUDE.md § "Ruby idioms that do not translate literally".

The same MySQL `newColumnDefinition` also checks the branches in a different order
from Rails. Rails' `case type` checks `:virtual`, then `:primary_key`, then
`/\Aunsigned_/` (`:67-77`). The TS body checks `primary_key` first, then
`virtual`, then `unsigned_`, and it carries `(options as any)` casts.

## Acceptance criteria

- The generated column method (and `column` / `newColumnDefinition` as needed) gives
  each name its own copy of the options, as Ruby's `**options` splat does, so an
  override's mutation never leaks to the caller or to sibling names. Add a regression
  test that fails on the shared-object shape: after `td.unsignedInteger("a", "b", opts)`,
  `opts` has no `unsigned` key.
- MySQL `TableDefinition#newColumnDefinition` checks `virtual`, `primary_key`,
  `unsigned_` in Rails' order (`mysql/schema_definitions.rb:67-77`), without the
  `as any` casts.
