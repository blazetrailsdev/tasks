---
title: "Base.relation() takes a table argument Rails' relation does not"
status: claimed
updated: 2026-08-22
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: "2026-08-22T11:20:34Z"
assignee: "ci-lint-scope-misses-cross-file-type-driven-breaks"
blocked-by: null
closed-reason: null
---

# `Base.relation()` takes a `table` argument Rails' `relation` does not

## Context

Rails' `Core::ClassMethods#relation`
(`activerecord/lib/active_record/core.rb:431-435`) takes **no arguments** — it
builds against `arel_table`, and `type_condition`'s own default
(`inheritance.rb:322`, `def type_condition(table = arel_table)`) picks the same
table up.

PR #6852 ported it at the Rails name but kept the trails-only parameter the
retired `_buildUnscopedRelation(table?)` carried:

```ts
static relation(table?: any): any {
  const relation = Relation.create(this, { table });
  ...
}
```

`packages/activerecord/src/base.ts:2176-2194`. Two callers pass it:

- `packages/activerecord/src/associations/association-scope.ts:891` —
  `entryKlass.relation(aliasedTable)`, so a self-referential through gets the
  STI predicate on the alias rather than the FROM table.
- nothing else; every other caller (`scoping/default.ts` `unscoped`,
  `scoping/named.ts`, `base.ts` `_buildDefaultRelation` and the
  `mergeBang` arm) calls it bare.

Rails reaches the same place differently: `AssociationScope` builds its aliased
constraints through `AbstractReflection#build_scope`
(`activerecord/lib/active_record/reflection.rb:336-338`), which is
`Relation.create(klass, table: table, predicate_builder: ...)` — the seat that
takes a table. #6840 ported `build_scope` onto `Relation.create`, so the seat
already exists.

## Converged shape

`relation()` takes no arguments, matching core.rb:431. The one caller that
needs an aliased table goes through `AbstractReflection#build_scope` /
`Relation.create` instead — the Rails seat for exactly that — and applies the
STI condition the way `reflection.rb:285-286` already does
(`if targetKlass.isFinderNeedsTypeCondition() scope = scope.where(typeCondition(targetKlass, table))`),
which is a shape `packages/activerecord/src/reflection.ts` already contains.

Check whether the association-scope call site can simply BE that path rather
than growing a parallel one.

## Acceptance criteria

- [ ] `Base.relation()` is 0-arg, matching core.rb:431.
- [ ] `association-scope.ts:891` reaches its aliased, type-conditioned relation
      through the Rails seat (`build_scope` / `Relation.create`), not through a
      trails parameter.
- [ ] Self-referential `through` associations still put the STI predicate on the
      alias and the source-type predicate on the FROM table — the invariant the
      parameter was introduced for. Pin it with a test if none exists.
- [ ] `parity:api` arity for `relation` is satisfied by a 0-arg method;
      `parity:api:calls` green; association suites pass on all three adapters.
