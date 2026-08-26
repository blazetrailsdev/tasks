---
title: "PostgreSQL's dropTable override has no Rails counterpart"
status: blocked
updated: 2026-08-26
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: "2026-08-26T16:41:51Z"
assignee: "table-type-caster-delegations-cast-away-the-null-name"
blocked-by: "Premise falsified: Rails DOES define PostgreSQL#drop_table at vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb:57-60 (one statement for all table_names, plus ' CASCADE' if options[:force] == :cascade). The story's grep only covered connection_adapters/postgresql*.rb, missing the postgresql/ subdirectory. trails' override at connection-adapters/postgresql/schema-statements-class.ts mirrors that body; deleting it would drop CASCADE support on PG and diverge from Rails. Rails has three drop_table bodies (abstract/schema_statements.rb:540, postgresql/schema_statements.rb:57, abstract_mysql_adapter.rb:354) and trails has three. The residual TS-only duplication is the *args/**options/&block parse, which Ruby gets free from the signature."
closed-reason: null
---

# PostgreSQL's `dropTable` override has no Rails counterpart

## Context

Surfaced in PR #7038 (RFC 0051, `migration-recording-flag-should-be-the-connection`).

Rails defines `drop_table` twice: the base
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:540`)
and one MySQL override
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb`,
for `TEMPORARY`). PostgreSQL has NO `drop_table` — `grep -n "def drop_table"
vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql*`
returns nothing; PG rides the base, which already emits
`DROP TABLE#{' IF EXISTS'} ... #{' CASCADE'}`.

trails has a third body,
`packages/activerecord/src/connection-adapters/postgresql/schema-statements-class.ts`
(`override async dropTable`), which re-implements the base line for line: the
same trailing-options parse, the same `tableNames.length === 0` ArgumentError,
the same `clearDataSourceCacheBang` loop, the same SQL. The only difference is
that it quotes all names into one statement.

Because the parse is copied rather than inherited, a change to the base has to
be made three times. PR #7038 hit exactly that: teaching `dropTable` to ignore
Ruby's `&block` (passed as a trailing function once `Migration` routes schema
statements through the connection) had to be repeated in all three bodies, and
the PG one was missed first — reddening
`invertible-migration.test.ts` > `migrate down with table name prefix` on the
PostgreSQL lanes only, with `table "undefined" does not exist`.

## Converged shape

Delete `PostgreSQL::SchemaStatements#dropTable` and let PG inherit the base, as
Rails does. If the single-statement multi-table `DROP TABLE a, b` form is worth
keeping, it belongs in the base (Rails' base loops one statement per table), not
in a PG-only copy.

## Acceptance criteria

- [ ] No `dropTable` in `postgresql/schema-statements-class.ts`; PG resolves the
      inherited one.
- [ ] The `dropTable` arg parse exists in the base and the MySQL override only,
      matching Rails' two definitions.
- [ ] `invertible-migration.test.ts`, `schema-statements-class.trails.test.ts`
      and `schema-statements.trails.test.ts` stay green on SQLite, PostgreSQL
      and MySQL/MariaDB.
