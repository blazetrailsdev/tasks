---
title: "Drop the SchemaStatements adapter constructor and AbstractAdapter's self-returning adapter getter"
status: done
updated: 2026-08-02
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: 5854
claim: "2026-08-02T02:06:48Z"
assignee: "drop-schema-statements-adapter-constructor-and-self-getter"
blocked-by: null
closed-reason: null
---

## Context

Rails' `SchemaStatements` is a module whose bodies call plain `self` methods.
trails still carries the companion-class scaffold that predates the mixin flip:

- `SchemaStatements` (`connection-adapters/abstract/schema-statements.ts:288`)
  declares `constructor(protected readonly adapter: DatabaseAdapter & SchemaQuoter)`
  and reaches the adapter through `this.adapter` in 127 places.
- `AbstractAdapter` carries `protected get adapter()` returning `this`
  (`connection-adapters/abstract-adapter.ts:1174`) purely so those bodies still
  resolve when the module is mixed in. Its own JSDoc says as much. Rails has no
  such member.
- The PG (32 sites) and MySQL (3 sites) subclasses inherit the same idiom.

Every consumer is now a mixin: `include(AbstractAdapter, SchemaStatements)`,
`include(AbstractMysqlAdapter, MysqlSchemaStatements)` and — as of #5844 —
`include(PostgreSQLAdapter, PostgreSQLSchemaStatements)`. #5841 deleted the last
`schemaStatements()` accessor. Nothing constructs these classes in production
code any more, so the constructor and the self-getter are dead scaffolding whose
only remaining effect is to make the bodies read unlike Rails.

## Acceptance criteria

- `this.adapter.x(...)` becomes `this.x(...)` in the schema-statements bodies
  (abstract + postgresql + mysql).
- `SchemaStatements`' `adapter` constructor parameter is gone; the class has no
  constructor.
- `AbstractAdapter`'s `protected get adapter()` is deleted along with its
  `@internal` JSDoc.
- The unit tests that construct these classes directly are re-pointed at an
  adapter prototype, the way #5844 did for
  `postgresql/schema-statements-class.test.ts`.
- SQLite / PG / MySQL suites stay green; parity:api delta non-negative.

Note: ~160 call sites across three files will not fit one 500-LOC PR. Expect to
split by file (abstract / postgresql / mysql) with non-overlapping files, each
branched from `main`.
