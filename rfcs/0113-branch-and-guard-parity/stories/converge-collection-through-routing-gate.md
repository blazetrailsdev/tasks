---
title: "Remove the has_many :through routing gate and its bespoke fallback loader"
status: done
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: 31
pr: 7544
claim: "2026-09-05T23:00:28Z"
assignee: "fold-skeleton-tokens-takes-an-idiom-lowering-table"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #7268, which removed the singular half of this gate.

`HasManyThroughAssociation`'s `findTarget`
(`packages/activerecord/src/associations/has-many-association.ts:424`) still
routes on `_routeThroughViaAssociationScope(record, reflThrough, options)`
(`packages/activerecord/src/associations.ts:472-482`, over
`_canRouteThroughViaAssociationScope` at `:446-469`): when the gate returns
false it abandons the scope chain and takes a bespoke loader path instead.

Rails has no such gate. `CollectionAssociation#find_target`
(`vendor/rails/activerecord/lib/active_record/associations/collection_association.rb`)
builds `scope.to_a` like any other association, and
`HasManyThroughAssociation`
(`vendor/rails/activerecord/lib/active_record/associations/has_many_through_association.rb`)
overrides only the insert/delete side — `ThroughAssociation#scope`
(`through_association.rb`) folds the through chain into the reflection's scope.

The shapes the gate rejects are:

1. a polymorphic source reflection that is not `belongs_to`
   (`associations.ts:458-464`),
2. a polymorphic `belongs_to` source with no `:source_type`
   (`associations.ts:465-467`),
3. a new-record owner on a nested through (`associations.ts:478-480`).

PR #7268 deleted the identical gate from `SingularAssociation#find_target` and
the whole `associations/` suite (116 files, 2043 tests) stayed green on SQLite,
which is direct evidence that AssociationScope already builds all three shapes.
The collection half is very likely vestigial for the same reason, but it has
its own bespoke loader to retire alongside it, so it was out of scope there.

## Converged shape

Delete the `_routeThroughViaAssociationScope` call from
`has-many-association.ts:424` and the loader path it guards, leaving
`find_target` to build the scope chain unconditionally, as
`collection_association.rb` does. With no callers left,
`_routeThroughViaAssociationScope` and `_canRouteThroughViaAssociationScope`
come out of `associations.ts` too.

## Acceptance criteria

1. `has-many-association.ts` no longer consults
   `_routeThroughViaAssociationScope`; the bespoke fallback loader is deleted.
2. `_routeThroughViaAssociationScope` and `_canRouteThroughViaAssociationScope`
   are gone from `associations.ts` (no remaining callers after #7268).
3. `has-many-through-associations`, `nested-through-associations`,
   `nested-through-advanced`, `polymorphic-sti-through` and the preloader
   suites pass on SQLite, PostgreSQL and MySQL, with no test renames.
4. `pnpm parity:api:calls` / `:args` add no rows;
   `associations/has-many-association.ts` does not gain novel extra surface.
