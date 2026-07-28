---
title: "Mix MySQL foreignKeys onto AbstractMysqlAdapter instead of a Mysql2Adapter host literal"
status: done
updated: 2026-07-28
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5526
claim: "2026-07-28T18:13:36Z"
assignee: "mix-mysql-foreign-keys-onto-abstract-adapter"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while removing `_mysqlFkAction` in #5477.

In Rails, `MySQL::SchemaStatements` is a module `include`d into
`AbstractMysqlAdapter` (`abstract_mysql_adapter.rb:22`), so `foreign_keys` and
its protected helper `extract_foreign_key_action`
(`mysql/schema_statements.rb:225`) are real instance methods on every MySQL
adapter.

trails instead has:

- `AbstractMysqlAdapter#foreignKeys`
  (`connection-adapters/abstract-mysql-adapter.ts:1070`) as a stub returning
  `[]` — no MySQL adapter reads FKs through the abstract class.
- `Mysql2Adapter#foreignKeys` (`connection-adapters/mysql2-adapter.ts:1838`)
  overriding it to `.call()` the standalone `foreignKeys` helper against a
  hand-assembled `ForeignKeysHost` literal (`schemaQuery`, `quote`,
  `extractForeignKeyAction`).

PR #5477 removed the invented `_mysqlFkAction` name and the protected-visibility
workaround, but the host-literal shape and the `[]` stub remain: the mixin is
still simulated at one call site rather than assigned onto the class the way
CLAUDE.md's module-mixin convention prescribes.

## Acceptance criteria

- [ ] `foreignKeys` (and `extractForeignKeyAction`) are mixed onto
      `AbstractMysqlAdapter` per the `this`-typed-function convention, so the
      abstract adapter reads real foreign keys instead of returning `[]`.
- [ ] `Mysql2Adapter`'s override and its `ForeignKeysHost` literal are removed;
      `ForeignKeysHost` becomes the `this` type of the mixed-in function.
- [ ] Existing MySQL FK coverage (`migration/foreign-key.test.ts`,
      `connection-adapters/mysql/schema-statements.test.ts`) still passes,
      including RESTRICT reflecting as nil.
