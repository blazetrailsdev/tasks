---
title: "Converge or uniformly guard the SchemaStatements adapter-dispatch shim (9 sites still self-dispatch on super)"
status: done
updated: 2026-08-01
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5794
claim: "2026-08-01T03:43:46Z"
assignee: "schema-statements-adapter-dispatch-shim-self-dispatch"
blocked-by: null
closed-reason: null
---

## Context

`abstract/schema-statements.ts` routes 10 methods through a hand-rolled
"did the adapter override this?" shim:

```ts
const adapter = this.adapter as any;
if (adapter !== this && typeof adapter.removeForeignKey === "function" &&
    adapter.removeForeignKey !== SchemaStatements.prototype.removeForeignKey) {
  return adapter.removeForeignKey(...);
}
```

Sites (`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts`):
`removeColumn` :436, `renameColumn` :454, `changeColumn` :541,
`changeColumnDefault` :665, `addForeignKey` :810, `removeForeignKey` :863,
`addCheckConstraint` :913, `removeCheckConstraint` :942, `foreignKeys` :1426,
`checkConstraints` :1770.

Rails has no such shim — `SchemaStatements` is a plain module and Ruby's own
method lookup handles the override, with `super` walking back up the ancestor
chain (`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb`).
The shim exists because `SchemaStatements` is BOTH a standalone companion class
(`schemaStatements()`, `abstract-adapter.ts:1474`) and a mixin
(`include(AbstractAdapter, SchemaStatements)`, `abstract-adapter.ts:2648`).

PR #5476 hit the trap this creates: in the mixed-in case `this.adapter === this`
(`abstract-adapter.ts:1167-1170`), so an adapter override calling
`super.removeForeignKey` was dispatched straight back into itself and looped
forever. That PR added an `adapter !== this` self-dispatch guard to
`removeForeignKey` ONLY. The other 9 sites still carry the trap: the next
adapter override that calls `super` at any of them infinite-loops, with no test
or lint catching it.

## Acceptance criteria

- Either the `adapter !== this` guard is applied uniformly to all 10 sites, or
  (preferred, and the fidelity fix) the shim is removed entirely by making the
  companion/mixin duality unnecessary so plain prototype dispatch + `super`
  works as it does in Rails.
- A test covers an adapter override reaching the base body via `super` for at
  least one non-`removeForeignKey` site, and fails on the pre-fix baseline.
- No behavior change for the existing SQLite/MySQL/PG overrides; the FK,
  check-constraint, and column-mutator suites stay green on all three adapters.
