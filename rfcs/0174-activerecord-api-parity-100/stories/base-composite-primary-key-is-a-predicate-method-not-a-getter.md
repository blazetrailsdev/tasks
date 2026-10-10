---
title: "activerecord: Base.composite_primary_key? is isCompositePrimaryKey(), not a static getter"
status: ready
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`composite_primary_key?` (`vendor/rails/v8.0.2/activerecord/lib/active_record/attribute_methods/primary_key.rb:85-88`)
is a class-level predicate. `packages/activerecord/src/base.ts:704` exposes it as a static
getter, `static get compositePrimaryKey(): boolean`, over
`attribute-methods/primary-key.ts` `isCompositePrimaryKey`, so `Post.isCompositePrimaryKey()`
does not exist and 23 non-test readers under `packages/activerecord/src` spell it
`klass.compositePrimaryKey`. A Ruby predicate `foo?` ports as `isFoo`
(CLAUDE.md "Did you port a Ruby predicate?"). Found while converging
`compute_primary_key` (`autosave_association.rb:611`, `record.class.composite_primary_key?`),
which had to call `isCompositePrimaryKey.call(record.constructor)` because the class has no
method of that name.

## Acceptance criteria

- [ ] `Base.isCompositePrimaryKey()` is the class method; the `compositePrimaryKey` getter is deleted.
- [ ] Every `.compositePrimaryKey` reader calls `isCompositePrimaryKey()`.
- [ ] `autosave-association.ts` `computePrimaryKey` reads `record.constructor.isCompositePrimaryKey()`.
- [ ] `pnpm parity:api:predicates` and `pnpm parity:api:extra:gate` pass.
