---
title: "Escape table_name_prefix/suffix in the two raw strip regexes"
status: blocked
updated: 2026-08-31
rfc: "0119-connection-adapter-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: "2026-08-31T12:34:13Z"
assignee: "async-overrides-of-synchronous-rails-adapter-methods"
blocked-by: "Story premise is stale: Rails itself does NOT escape at the two named sites. AbstractSchemaStatements#strip_table_name_prefix_and_suffix (schema_statements.rb:1749-1753) builds /#{prefix}(.+)#{suffix}/ with no Regexp.escape, and trails' stripTableNamePrefixAndSuffix (connection-adapters/abstract/schema-statements.ts:1749) mirrors it line-for-line. The third site, TableDefinition#new_foreign_key_definition (schema_definitions.rb:575-581), is plain string concatenation in Rails and in trails (abstract/schema-definitions.ts newForeignKeyDefinition) — there is no regex left to escape. Only SchemaDumper#remove_prefix_and_suffix (schema_dumper.rb:366-373) escapes in Rails, and trails already escapes there. Adding escaping to the other two would be a deviation FROM Rails, not a convergence toward it. Needs a respec (upstream-bug story) before it can be worked."
closed-reason: null
---

## Context

Rails escapes the table-name prefix/suffix before building the strip regex:

```ruby
prefix = Regexp.escape(@options[:table_name_prefix].to_s)
suffix = Regexp.escape(@options[:table_name_suffix].to_s)
```

(`vendor/rails/activerecord/lib/active_record/schema_dumper.rb:366-373`).

trails escapes in one of the three places that build the same regex:

- `packages/activerecord/src/schema-dumper.ts` `removePrefixAndSuffix` — escapes.
- `packages/activerecord/src/connection-adapters/abstract/schema-statements.ts`
  `stripTableNamePrefixAndSuffix` — interpolates raw.
- `packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts`
  `TableDefinition`'s `_foreignKeyOptions` `columnFor` fallback — interpolates raw.

A prefix or suffix containing a regex metacharacter (`app.`, `v1+`, `t[0]_`)
therefore strips the wrong span or fails to match, which silently changes the
derived foreign-key column name and the dumped table name.

This became reachable in #5453. Before it, both unescaped sites read
`adapter.tableNamePrefix`, which nothing ever populated, so the prefix was
always `""` and the branch was dead. #5453 wired the real
`Base.tableNamePrefix` through the `table-name-options` registry, so these two
sites now see live user-set values.

## Acceptance criteria

- [ ] Both unescaped sites escape prefix and suffix the way
      `schema-dumper.ts` already does, matching Rails' `Regexp.escape`.
- [ ] A regression test sets a metacharacter-bearing `Base.tableNamePrefix`
      and asserts the derived FK column and the dumped table name; it fails on
      the current implementation.
- [ ] The escape helper is shared rather than copied a third time.
