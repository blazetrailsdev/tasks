---
title: "Converge the 14 activerecord `join` separators that differ from Rails"
status: done
updated: 2026-08-12
rfc: "0099-call-argument-convergence"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 168
priority: null
pr: trails#6362
claim: "2026-08-11T14:26:06Z"
assignee: "arel-tosql-statement-visitor-helper-calls"
blocked-by: null
closed-reason: null
---

## Context

Filed by the RFC 0099 classification pass over the 410 `activerecord`
`kind: "args"` rows of the RFC 0095 call-argument baseline — bucket (a),
genuine divergence. 14 rows across 10 files.

`Array#join` is called with a different separator than Rails uses — a newline rendered as `", "` in schema-dumper output, `" "` vs `", "` in `visit_AlterTable`, `"_"` vs `", "` in `index_name_for_remove`. Each one changes emitted SQL or dump text; check the Rails body and the emitted string at every site.

Rows live in `scripts/api-compare/call-mismatches-exclude/activerecord/**.json`
with `kind: "args"`, keyed `package + tsFile + rubyName + call + rubyArgs`.

### Rows

- `connection-adapters/abstract/schema-creation.ts` `visit_AlterTable` → `join`: Rails (`connection_adapters/abstract/schema_creation.rb`) `(str: )` vs trails `(str:, )`
- `connection-adapters/abstract/schema-statements.ts` `index_name_for_remove` → `join`: Rails (`connection_adapters/abstract/schema_statements.rb`) `(str:, )` vs trails `(str:_)`
- `connection-adapters/postgresql/schema-creation.ts` `visit_AlterTable` → `join`: Rails (`connection_adapters/postgresql/schema_creation.rb`) `(str: )` vs trails `(str:, )`
- `connection-adapters/postgresql/schema-dumper.ts` `exclusion_constraints_in_create` → `join`: Rails (`connection_adapters/postgresql/schema_dumper.rb`) `(str:<n>)` vs trails `(str:, )`
- `connection-adapters/postgresql/schema-dumper.ts` `unique_constraints_in_create` → `join`: Rails (`connection_adapters/postgresql/schema_dumper.rb`) `(str:<n>)` vs trails `(str:, )`
- `connection-adapters/sqlite3/explain-pretty-printer.ts` `pp` → `join`: Rails (`connection_adapters/sqlite3/explain_pretty_printer.rb`) `(str:<n>)` vs trails `(str:|)`
- `database-configurations.ts` `build_configuration_sentence` → `join`: Rails (`database_configurations.rb`) `(str:<n>)` vs trails `(str:, )`
- `model-schema.ts` `derive_join_table_name` → `join`: Rails (`model_schema.rb`) `(str:\0)` vs trails `(str:�)`
- `relation.ts` `exec_explain` → `join`: Rails (`relation.rb`) `(str:<n>)` vs trails `(str:<n><n>)`
- `relation/query-methods.ts` `unscope!` → `join`: Rails (`relation/query_methods.rb`) `(str:, :)` vs trails `(str:, )`
- `schema-dumper.ts` `check_constraints_in_create` → `join`: Rails (`schema_dumper.rb`) `(str:<n>)` vs trails `(str:, )`
- `schema-dumper.ts` `foreign_keys` → `join`: Rails (`schema_dumper.rb`) `(str:<n>)` vs trails `(str:, )`

## Acceptance criteria

1. Each call site above passes what the Rails body passes, verified against
   the vendored Rails file named on the row.
2. The corresponding baseline rows are DELETED (only-shrink: a converged row
   goes stale and reds the gate until removed by hand — never `--write`).
3. `pnpm parity:api:calls:args` and `pnpm parity:api:calls` are green.
4. Anything that genuinely cannot converge keeps a reviewed one-line `reason`
   naming the Rails `file:line` and the blocker — never the seeded placeholder.
