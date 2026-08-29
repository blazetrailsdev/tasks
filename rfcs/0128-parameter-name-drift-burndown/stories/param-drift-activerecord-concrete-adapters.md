---
title: "Parameter-name drift: activerecord postgresql, mysql and sqlite3 adapters"
status: in-progress
updated: 2026-08-28
rfc: "0128-parameter-name-drift-burndown"
cluster: fidelity
packages:
  - activerecord
deps:
  - parity-api-compares-parameter-names-beside-arity
deps-rfc: []
est-loc: 228
priority: 2
pr: 7191
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The parameter-name check landed by `parity-api-compares-parameter-names-beside-arity`
(RFC 0126) reports **57 positions over 49 matched pairs** in the CONCRETE adapters (`connection_adapters/{postgresql,mysql,sqlite3}*`)
where the TS parameter is not the Rails identifier camelCased. CLAUDE.md makes
that spelling the rule ("a local or parameter keeps the Rails identifier,
camelCased — Ruby `stmt` is `stmt`, not `statement`"); it went unmeasured until
this check, so the drift accumulated silently while arity read 100%.

Rows by file:

- `connection_adapters/postgresql_adapter.rb` — 15
- `connection_adapters/postgresql/schema_statements.rb` — 10
- `connection_adapters/sqlite3_adapter.rb` — 6
- `connection_adapters/mysql/schema_statements.rb` — 4
- `connection_adapters/sqlite3/schema_statements.rb` — 4
- `connection_adapters/postgresql/column.rb` — 3
- `connection_adapters/sqlite3/column.rb` — 3
- `connection_adapters/postgresql/oid/point.rb` — 2
- `connection_adapters/postgresql/quoting.rb` — 2
- `connection_adapters/postgresql/utils.rb` — 2
- …and 5 further files with fewer rows each.

A sample, in the artifact's own format (`output/param-name-mismatches.json`):

```text
  connection_adapters/mysql/schema_creation.rb#add_table_options! @0  `createSql` → `sql`
  connection_adapters/mysql/schema_statements.rb#create_table @0  `tableName` → `name`
  connection_adapters/mysql/schema_statements.rb#create_table @1  `options` → `optionsOrFn`
  connection_adapters/mysql/schema_statements.rb#extract_schema_qualified_name @0  `string` → `str`
  connection_adapters/mysql/schema_statements.rb#remove_foreign_key @1  `toTable` → `toTableOrOptions`
  connection_adapters/postgresql/column.rb#initialize @1  `serial` → `defaultValue`
  connection_adapters/postgresql/column.rb#initialize @2  `identity` → `sqlTypeMetadata`
  connection_adapters/postgresql/column.rb#initialize @3  `generated` → `null_`
```

## Verifying

```bash
API_COMPARE_FORCE=1 pnpm parity:api --package activerecord --params
```

lists every remaining position as `file:method  @position  ruby \`x\` ts \`y\``.
The story is done when that list is empty for the scope above.

Read each row before renaming it — see the RFC's "three shapes" section. A
union-type name (`columnOrOptions`) still takes the Rails identifier: the type
describes what the argument may be, the name describes what it is. A positional
misalignment — a dropped Rails parameter reported as a rename of its neighbour —
belongs to `param-drift-positional-misalignment-is-a-dropped-parameter` and is
left alone here.

## Acceptance criteria

- Every parameter in scope carries the Rails identifier, camelCased per
  `docs/ruby-ts-conventions.md`, verified against `vendor/rails`.
- No behaviour change and no test renamed; `pnpm parity:api` methods and arity
  figures unmoved, `parity:api:calls` and `parity:api:calls:args` no new row.
- There is no exclude register for parameter names and none is added. A position
  that genuinely cannot carry the Rails name is a `pnpm tasks block` naming the
  language shortcoming.
