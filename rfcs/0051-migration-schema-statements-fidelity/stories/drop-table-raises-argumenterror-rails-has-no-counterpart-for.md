---
title: "dropTable raises an ArgumentError on zero table names that Rails has no counterpart for"
status: done
updated: 2026-08-27
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: 7127
claim: "2026-08-27T18:13:52Z"
assignee: "group-model-ts-remaining-inline-mixin-literals-into-module-objects"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while blocking `postgresql-drop-table-override-has-no-rails-counterpart`
(PR #7093), which read all three Rails `drop_table` bodies side by side.

Rails' base `drop_table`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:540-545`):

```ruby
def drop_table(*table_names, **options)
  table_names.each do |table_name|
    schema_cache.clear_data_source_cache!(table_name.to_s)
    execute "DROP TABLE#{' IF EXISTS' if options[:if_exists]} #{quote_table_name(table_name)}"
  end
end
```

`table_names` is a splat: `drop_table()` iterates an empty array and is a
**no-op**. Neither the MySQL override (`abstract_mysql_adapter.rb:354-357`) nor
the PostgreSQL one (`postgresql/schema_statements.rb:57-60`) raises either —
MySQL/PG build a `join(", ")` over the empty list and would emit a degenerate
statement, but no adapter raises `ArgumentError`.

trails raises, in two of the three bodies:

- `packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:485-487`
- `packages/activerecord/src/connection-adapters/postgresql/schema-statements-class.ts:137-139`

```ts
if (tableNames.length === 0) {
  throw new ArgumentError("dropTable requires at least one table name");
}
```

The message is not a Rails string (it is camelCased trails prose), the error
class has no raise site in Rails, and the guard changes `drop_table()` from a
silent no-op into a raise. CLAUDE.md's error rule — "same error class, same
message string, same raise site" — has no counterpart to point at here, which
is the tell: the raise site itself is invented.

Note the guard is load-bearing for the _TS_ argument parse in a way it is not in
Ruby: because TS spells `**options` and `&block` as trailing positional
arguments, `dropTable(options)` with no name at all parses to zero names. That
is an argument for keeping _some_ behaviour there, not for keeping a raise Rails
does not have — check what Ruby actually does with `drop_table(if_exists: true)`
(kwargs never land in `table_names`, so it is a no-op) before choosing the
converged arm.

## Converged shape

Delete the guard from both bodies so `dropTable()` with no table names is the
no-op Rails' splat makes it. If the TS parse genuinely cannot distinguish "no
names" from "options only" without it, the guard belongs at the parse — not as a
raise — and its behaviour must match what Ruby does for the same call.

## Acceptance criteria

- [ ] No `ArgumentError` raise in `dropTable` that Rails has no counterpart for,
      in either the abstract or the PostgreSQL body.
- [ ] `dropTable()` and `dropTable({ ifExists: true })` behave as the Ruby calls
      do (verify with `ruby` against a real adapter or by reading the splat).
- [ ] `parity:api:calls` / `:args` clean; SQLite, PostgreSQL and MySQL/MariaDB
      lanes green.
