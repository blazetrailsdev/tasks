---
title: "activerecord: HasManyThroughAssociation reads through_association, not the throughProxy helper"
status: in-progress
updated: 2026-10-09
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8734
claim: "2026-10-09T23:09:51Z"
assignee: "schema-dumper-header-branches-on-the-ts-js-dump-language"
blocked-by: null
closed-reason: null
---

## Context

`throughProxy(assoc)` (`packages/activerecord/src/associations/has-many-through-association.ts:419-440`)
is a module-private helper with no Rails counterpart. For a collection through-reflection it
returns `(assoc.owner.association(tr.name) as CollectionAssociation).reader as unknown as ThroughTargetStore`
— the through association's CollectionProxy, double-cast to an invented `ThroughTargetStore`
interface (`:413`). Its three callers (`:258`, `:353`, `:387`) then read and mutate the through
target through that proxy.

Rails has no such helper: `HasManyThroughAssociation` reaches the through side via
`through_association` (`owner.association(through_reflection.name)`,
`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/through_association.rb`) and uses the
association object itself — `through_association.build(attributes)`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/has_many_through_association.rb:63`),
`through_association.scope` (`:143`), `through_association.target` (`:201`, `:214-216`).

Surfaced in review of trails#8672, which only swapped the deleted `collectionProxyFor` call for the
inline `association(name).reader` read and left the helper in place.

## Acceptance criteria

- [ ] `throughProxy` and the `ThroughTargetStore` interface are deleted.
- [ ] Each caller reads `throughAssociation` (the association object) and calls
      `.target` / `.build` / `.scope` on it where the Rails body at the cited lines does.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green; has-many-through suites green.
