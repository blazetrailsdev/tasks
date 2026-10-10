---
title: "CompositePrimaryKey is included by primary_key= only, and its methods keep Rails' composite guard"
status: in-progress
updated: 2026-10-10
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#8741
claim: "2026-10-10T01:39:35Z"
assignee: "composite-primary-key-is-included-by-primary-key-setter-only"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `composite-primary-key-predicate-reads-the-primary-key-setter-ivar` (trails#8722), which
ported the Array arm of `primary_key=`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/attribute_methods/primary_key.rb:130-140`),
including its `include CompositePrimaryKey` (`:132`). That is the only place Rails includes the
module: a model gets `CompositePrimaryKey`'s `id`, `id=`, `id?`, `id_before_type_cast`, `id_was`,
`id_in_database`, `id_for_database` and `primary_key_values_present?`
(`attribute_methods/composite_primary_key.rb:5-82`) only once it is given an Array key. Each of
those bodies is `if self.class.composite_primary_key? … else super` (`:8-80`), which is what answers
a subclass that resets a composite parent's key to a scalar.

trails includes it into `Base` for every model
(`packages/activerecord/src/base.ts`, `include(Base, _CompositePrimaryKey)` beside
`include(Base, _PrimaryKey)`). Because every record then carries the composite methods, each one in
`packages/activerecord/src/attribute-methods/composite-primary-key.ts` runs its
`if ((record.constructor as any).compositePrimaryKey) … else super` arm on models Rails never gives
the module to. The `include(this, AttributeMethods.CompositePrimaryKey)` the setter now makes
(`packages/activerecord/src/attribute-methods/primary-key.ts`, `setPrimaryKeyAttr`) is a no-op for
that reason: `Base` already has the module's method table.

`restore-composite-primary-key-module-split` (RFC 0112, done) restored the two-module file split
but kept the global include.

## Converged shape

`Base` includes `PrimaryKey` only. `setPrimaryKeyAttr`'s Array arm is the one `include` site, so the
composite methods land on the class that set an Array key (and its subclasses). Every method in
`composite-primary-key.ts` keeps its `compositePrimaryKey` guard and `super` fallback, which are
Rails' own (`composite_primary_key.rb:8-80`). The first draft of this story read those bodies as
unconditional and asked for the guards to go; that premise was wrong at v8.0.2.

## Acceptance criteria

- [ ] `include(Base, _CompositePrimaryKey)` is gone from `base.ts`; the module is included only from
      `setPrimaryKeyAttr`'s Array arm.
- [ ] Every method in `attribute-methods/composite-primary-key.ts` keeps Rails'
      `composite_primary_key?` / `else super` arms, and a test shows a scalar-key model does not carry
      the module while an Array-key model and its subclasses do.
- [ ] `pnpm parity:api:arms:report --package=activerecord --direction=invented` has no row for
      `attribute-methods/composite-primary-key.ts`.
- [ ] `pnpm vitest run packages/activerecord/src/primary-keys.test.ts packages/activerecord/src/attribute-methods/`
      passes on SQLite, PostgreSQL and MariaDB.
