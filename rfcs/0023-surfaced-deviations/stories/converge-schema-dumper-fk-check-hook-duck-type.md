---
title: "Converge SchemaDumper FK/check-constraint hook duck-type onto Rails' supports_* gate"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "merged into adapter-schema-source-column-flag-duck-typing — same deviation class in the same file: schema-dumper.ts duck-types where Rails gates on supports_* and passes real Column objects"
---

## Context

`SchemaDumper._hookHost` / `_fkHookHost`
(`packages/activerecord/src/schema-dumper.ts:1067`, `:1080`) duck-type the
dumper's source for a `foreignKeys` / `checkConstraints` function and skip the
section entirely when the lookup fails. Rails has no such probe: it gates on the
adapter capability and then calls the connection method unconditionally —

- `schema_dumper.rb:145` `if @connection.supports_foreign_keys?` … `:317`
  `if (foreign_keys = @connection.foreign_keys(table)).any?`
- `schema_dumper.rb:210` `if @connection.supports_check_constraints?` … `:284`
  `if (check_constraints = @connection.check_constraints(table)).any?`

The duck-type was load-bearing while `SchemaStatements#foreignKeys` returned
`[]` for unsupported adapters. PR #5840 converged that body to
`raise NotImplementedError, "foreign_keys is not implemented"`
(`schema_statements.rb:1103`), and `checkConstraints` already raised, so the
`typeof fn === "function"` test now answers `true` for every adapter (both
methods are mixed into `AbstractAdapter`) and the real "adapter cannot report
these" signal is the raise, not a missing property. The probe is dead weight
that also diverges from the capability gate Rails actually uses.

## Acceptance criteria

- The foreign-key and check-constraint dump sections are gated on
  `supportsForeignKeys()` / `supportsCheckConstraints()` as in Rails, and call
  the connection method directly.
- `_hookHost` and `_fkHookHost` are deleted (or reduced to whatever the
  `AdapterSchemaSource`-vs-source indirection genuinely still needs, with the
  duck-type gone).
- SQLite, MySQL and PostgreSQL lanes green; `schema-dumper.test.ts` cases that
  construct a source with no `foreignKeys` hook are re-derived against the
  capability gate.
