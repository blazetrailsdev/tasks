---
title: "activerecord: PostgreSQL remove_index tests :name by key presence and reads it through to_s"
status: closed
updated: 2026-10-18
rfc: "0189-activerecord-surfaced-deviations"
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
closed-reason: "Operator triage 2026-10-18 (RFC 0189 refine): all parity axes at 100%; this is structural/shape fidelity with no user-observable behavior change — not worth pursuing. Closed as won't-fix."
---

## Context

Seen while converging `index_name_for_remove` in trails#8785.

`PostgreSQL::SchemaStatements#remove_index`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb:543-563`)
tests the `:name` KEY and reads the value through `to_s`:

```ruby
if options.key?(:name)                                                      # :546
  provided_index = Utils.extract_schema_qualified_name(options[:name].to_s) # :547
  options[:name] = provided_index.identifier
```

`packages/activerecord/src/connection-adapters/postgresql/schema-statements.ts#removeIndex`
tests the value instead (`if (options.name != null)`) and passes `options.name` with no `to_s`.
`{ name: nil }` therefore skips the arm in trails and takes it in Rails, where the name becomes `""`.
Since trails#8785 the abstract `indexNameForRemove` it then calls does test key presence, so the two
bodies now disagree about the same option.

## Converged shape

`if ("name" in options)` (credited as `key?` by `parity:api:calls`) and
`Utils.extractSchemaQualifiedName(toS(options.name))`.

## Acceptance criteria

- [ ] `removeIndex` in `postgresql/schema-statements.ts` tests `:name` by key presence and reads it through `toS`.
- [ ] A trails test covers `{ name: undefined }` taking the arm.
- [ ] `pnpm parity:api:calls` stays green.
