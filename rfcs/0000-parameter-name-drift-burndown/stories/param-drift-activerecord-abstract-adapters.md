---
title: "Parameter-name drift: activerecord abstract connection adapters"
status: ready
updated: 2026-08-28
rfc: "0000-parameter-name-drift-burndown"
cluster: fidelity
packages:
  - activerecord
deps:
  - parity-api-compares-parameter-names-beside-arity
deps-rfc: []
est-loc: 188
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The parameter-name check landed by `parity-api-compares-parameter-names-beside-arity`
(RFC 0126) reports **47 positions over 40 matched pairs** in the ABSTRACT connection adapters (`connection_adapters/abstract*`)
where the TS parameter is not the Rails identifier camelCased. CLAUDE.md makes
that spelling the rule ("a local or parameter keeps the Rails identifier,
camelCased — Ruby `stmt` is `stmt`, not `statement`"); it went unmeasured until
this check, so the drift accumulated silently while arity read 100%.

Rows by file:

- `connection_adapters/abstract_adapter.rb` — 14
- `connection_adapters/abstract/schema_definitions.rb` — 9
- `connection_adapters/abstract/schema_statements.rb` — 8
- `connection_adapters/abstract/database_statements.rb` — 5
- `connection_adapters/abstract_mysql_adapter.rb` — 4
- `connection_adapters/abstract/connection_pool.rb` — 3
- `connection_adapters/abstract/transaction.rb` — 2
- `connection_adapters/abstract/quoting.rb` — 1
- `connection_adapters/abstract/schema_creation.rb` — 1

A sample, in the artifact's own format (`output/param-name-mismatches.json`):

```text
  connection_adapters/abstract/connection_pool.rb#checkin @0  `` → `conn`
  connection_adapters/abstract/connection_pool.rb#checkout @0  `checkoutTimeout` → `timeout`
  connection_adapters/abstract/connection_pool.rb#remove @0  `` → `conn`
  connection_adapters/abstract/database_statements.rb#execute @1  `name` → `binds`
  connection_adapters/abstract/database_statements.rb#execute @2  `allowRetry` → `name`
  connection_adapters/abstract/database_statements.rb#raw_execute @4  `async` → `isAsync`
  connection_adapters/abstract/database_statements.rb#to_sql @0  `arelOrSqlString` → `arel`
  connection_adapters/abstract/database_statements.rb#to_sql_and_binds @0  `arelOrSqlString` → `arel`
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
