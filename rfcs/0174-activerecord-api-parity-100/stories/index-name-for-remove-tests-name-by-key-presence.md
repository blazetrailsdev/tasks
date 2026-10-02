---
title: "activerecord: index_name_for_remove tests :name by key presence, not truthiness"
status: draft
updated: 2026-10-02
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SchemaStatements#index_name_for_remove`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:1647-1677`)
turns on whether the `:name` KEY is present, three times:

```ruby
if !options.key?(:name) && expression_column_name?(column_name)      # :1652
checks << lambda { |i| i.name == options[:name].to_s } if options.key?(:name)   # :1659
if column_names.present? && !(options.key?(:name) && expression_column_name?(column_names))  # :1661
```

`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts#indexNameForRemove`
tests the VALUE's truthiness instead (`!options.name`, `if (options.name)`, `options.name &&`), and
compares `i.name === n` where Rails compares against `options[:name].to_s`. `{ name: nil }` and
`{ name: "" }` therefore take different arms than in Rails, and its first line returns
`options.name as string` where `can_remove_index_by_name?` only proves the key exists.

trails#8403 removed the invented arms from this body and left the predicates alone, because trails callers
forward option objects that can carry `name: undefined`, which `"name" in options` would read as
present.

## Converged shape

The three tests are key presence (ruby-compat `hasKey`, the port of `Hash#key?`), the check compares
`toS(options.name)`, and callers that forward an absent `name` stop setting the key (CLAUDE.md
§ "kwargs": a forwarded absent kwarg is not a present `nil`).

## Acceptance criteria

- [ ] `indexNameForRemove` tests `:name` by key presence at the three Rails sites and compares
      `options[:name].to_s`.
- [ ] Every caller that forwards `name: undefined` is found and fixed (`Table#removeIndex`,
      `Migration#removeIndex`, the adapter overrides); tests cover `{ name: undefined }` not being
      forwarded.
- [ ] `pnpm parity:api:calls` credits `key?` for the body.
