---
title: "column_exists? has two different TS spellings depending on receiver"
status: ready
updated: 2026-07-29
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
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

Rails has one method name, `column_exists?`, reachable two ways: on the
connection (`SchemaStatements#column_exists?`,
`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:132`)
and inside a `change_table` block (`Table#column_exists?`,
`abstract/schema_definitions.rb`). `change_schema_test.rb:453-461` exercises
both spellings of the same name.

trails renders them inconsistently:

- `SchemaStatements#columnExists`
  (`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:636`)
- `Table#isColumnExists`
  (`packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts:1545`)

So the same Rails method reads as two different TS names depending on the
receiver. Surfaced while porting `test_column_exists_on_table_with_no_options_parameter_supplied`
in PR #5558, where `t.columnExists(...)` fails with "is not a function" and the
call has to be spelled `t.isColumnExists(...)`.

Check the surrounding convention before picking a direction — `Table` also
carries `isIndexExists`, `isCheckConstraintExists` etc., so the `is` prefix may
be a deliberate local rule for `?` predicates; if so, `SchemaStatements` is the
side that diverges. Either way the two should agree, and api:compare's
`rails_name` mapping should point at whichever survives
([[project_rails_name_is_real_path_not_divergent_alias]]).

## Acceptance criteria

- [ ] `column_exists?` resolves to a single TS spelling across
      `SchemaStatements` and `Table` (and the sibling `*_exists?` predicates are
      consistent with it).
- [ ] Call sites updated; api:compare surface unchanged or improved.
- [ ] Green on all three lanes.
