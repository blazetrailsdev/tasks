---
title: "Delete the SchemaStatements dispatch shim by dissolving the companion/mixin duality"
status: done
updated: 2026-08-01
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 5812
claim: "2026-08-01T18:15:01Z"
assignee: "remove-schema-statements-dispatch-shim-companion-mixin-duality"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts`
still carries a TS-only dispatch shim, `_adapterOverride(name)` (added by
PR #5794), used by 12 methods — `removeColumn`, `renameColumn`, `changeColumn`,
`changeColumnDefault`, `addForeignKey`, `removeForeignKey`, `addCheckConstraint`,
`removeCheckConstraint`, `addTimestamps`, `removeColumns`, `foreignKeys`,
`checkConstraints` — plus the `schemaCreation` getter.

Rails has no equivalent: `SchemaStatements` is a plain module
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb`)
and Ruby's method lookup plus `super` handles adapter overrides natively.

The shim exists only because `SchemaStatements` is dual-purpose in trails: a
standalone companion class (`schemaStatements()`, `abstract-adapter.ts:1474`)
AND a mixin (`include(AbstractAdapter, SchemaStatements)`,
`abstract-adapter.ts:2648`). In the mixed-in case `this.adapter === this`, which
is what makes the `adapter !== this` self-dispatch guard necessary at all.

PR #5794 made the guard uniform and centralized, closing the infinite-loop trap
at every site, but explicitly deferred the fidelity fix: dissolve the
companion/mixin duality so plain prototype dispatch + `super` works exactly as
it does in Rails, and delete `_adapterOverride` and every call to it.

## Acceptance criteria

- The companion/mixin duality is resolved: `SchemaStatements` is used one way,
  so `this.adapter === this` is no longer a case the code must defend against.
- `_adapterOverride` and all 12 call sites are deleted; adapter overrides reach
  the base body via plain `super`.
- The `schemaCreation` getter drops its `this.adapter === this` check too.
- The `super`-reaching test added in PR #5794
  (`schema-statements-on-adapter.test.ts`) still passes unchanged.
- FK, check-constraint, and column-mutator suites stay green on SQLite, MySQL,
  and PostgreSQL.
