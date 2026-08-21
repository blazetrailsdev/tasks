---
title: "port-relation-create-for-build-scope"
status: in-progress
updated: 2026-08-21
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6840
claim: "2026-08-21T21:20:33Z"
assignee: "port-relation-create-for-build-scope"
blocked-by: null
closed-reason: null
---

# Port `Relation.create` (relation_class_for) so `build_scope` can call it

## Context

`AbstractReflection#build_scope` (reflection.rb:336-338) is
`Relation.create(klass, table:, predicate_builder:)`. trails
(`packages/activerecord/src/reflection.ts:232-239`) calls
`target._buildBareRelation(table)` — an `@internal` static on `Base`
(`base.ts:2203-2206`) that constructs `new (_relationCtorFor(this))(this,
table)` and wraps it in the scope proxy. That is exactly what Rails'
`Relation.create` does (`relation/delegation.rb`:
`relation_class_for(klass).new(klass, *args, **kwargs)`), just under a
trails-invented name on the wrong class, which is why the call-set gate
carries a `build_scope -> create` row in
`scripts/api-compare/call-mismatches-exclude/activerecord/reflection.json`
(reviewed reason added by
`wave-4c-ar-core-residue-attributes-remainder-part-3`).

`_buildBareRelation` is also extra surface on `Base` with no Ruby
counterpart, so converging retires an `api:extra` name at the same time. Its
only caller is `reflection.ts:238`; `relation.ts:542` and
`relation/merger.ts:286` already cite `Relation.create` in comments while
constructing relations by hand.

## Acceptance criteria

- [ ] `Relation` gains a static `create` mirroring
      `Delegation::ClassMethods#create`, with `relationClassFor` alongside it
      in `relation/delegation.ts` where Rails puts them.
- [ ] `buildScope` calls `Relation.create(klass, { table, predicateBuilder })`.
- [ ] `Base._buildBareRelation` is deleted (its behaviour moves into
      `Relation.create` / `relationClassFor`); the STI `type_condition` must
      still NOT be baked in — `join_scope` adds it later, qualified by the
      join's possibly-aliased table (see the comment at `base.ts:2197-2202`).
- [ ] The `build_scope -> create` row is deleted by hand via
      `serializeBaseline` and
      `pnpm parity:api:calls:tighten activerecord/reflection.json` run.
- [ ] `pnpm parity:api:calls` green; `pnpm parity:api:extra --package
activerecord` shows one fewer novel name and no new one.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
