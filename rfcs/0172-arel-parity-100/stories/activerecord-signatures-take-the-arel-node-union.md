---
title: "activerecord: signatures take the arel_node? union (~600 LOC, types only)"
status: ready
updated: 2026-10-02
rfc: "0172-arel-parity-100"
cluster: null
packages: []
deps:
  - arel-signatures-take-the-arel-node-union
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The activerecord half of `arel-signatures-take-the-arel-node-union`. With
`Arel::Attributes::Attribute` and `Arel::Nodes::SqlLiteral` off the `Node`
superclass (`vendor/rails/v8.0.2/activerecord/lib/arel/attributes/attribute.rb:5`,
`arel/nodes/sql_literal.rb:5`) and arel's own signatures widened, 188 `tsc`
errors remain, all in activerecord sources and tests. They come from roughly
250 type positions spelled `Nodes.Node` that receive an `Attribute` or a
`SqlLiteral`:

- `packages/activerecord/src/relation/query-methods.ts` — `OrderArg`,
  `groupValues` / `orderValues`, `group`, `inOrderOf`, `where` / `having`'s
  `opts`, `buildOrder`.
- `packages/activerecord/src/relation/calculations.ts` — every `columnName`
  (`count`, `sum`, `average`, `minimum`, `maximum`, `calculate`, `pluck`),
  `selectValues`, `aggregateColumn`.
- `packages/activerecord/src/relation.ts` — `selectValues` / `groupValues` /
  `orderValues`, the `select` / `reselect` / `group` / `from` / `where` /
  `having` declarations, `tablesInString`, `arelColumns` callers.
- `relation/where-clause.ts` (`predicates`, `extractAttribute`,
  `invertPredicate`), `relation/predicate-builder.ts`,
  `relation/predicate-builder/array-handler.ts` and
  `deferred-distinct-pk-in.ts`, `sanitization.ts` (`disallowRawSqlBang`,
  `sanitizeSqlForOrder`), `model-schema.ts`, `internal-metadata.ts`,
  `schema-migration.ts`, `persistence.ts`,
  `connection-adapters/abstract-adapter.ts` (`columnForAttribute`),
  `abstract-mysql-adapter.ts`, `abstract/database-statements.ts`,
  `abstract/schema-statements.ts`,
  `associations/join-dependency/join-association.ts`,
  `encryption/test-helpers.ts`.
- `scripts/parity/pipeline/fixtures/{ar,arel}-*/query.ts` — about 40 fixtures
  pass an `Attribute` or `SqlLiteral` where a `Node` is declared.

Tests: about a dozen call `toSql()` / `isEquality()` on a `SqlLiteral` or an
`Attribute`. Rails gives neither class those methods (`Node#to_sql`,
`vendor/rails/v8.0.2/activerecord/lib/arel/nodes/node.rb`), so those tests
compile the value through a visitor instead.

## Acceptance criteria

- [ ] Every activerecord signature and field that accepts an `Attribute` or a
      `SqlLiteral` as a `Nodes.Node` takes the `arel_node?` union type arel
      exports: with both classes' `extends Node` removed locally, `pnpm typecheck`
      is clean outside the two class files.
- [ ] No test calls a `Node` method on an `Attribute` or a `SqlLiteral`.
- [ ] No runtime change. The AR suite in CI and `pnpm parity:api:extra:gate`
      green.
