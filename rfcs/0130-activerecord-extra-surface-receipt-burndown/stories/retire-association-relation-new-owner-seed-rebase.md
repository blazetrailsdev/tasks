---
title: "retire-association-relation-new-owner-seed-rebase"
status: draft
updated: 2026-09-05
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/associations/new-owner-seed-rebase.ts` is a
trails-only file exporting `rebaseNewOwnerSeed(target, freshScope,
seedPredicates)`, which strips the seeded `where` predicates off an
`AssociationRelation`, clears `_isNone`, and re-merges a freshly-built
association scope through `Merger`.

Its only caller is `association-relation.ts:46-65`
(`_maybeRebaseAssociationSeed`, itself driven from the `isNullRelation`
override at `:41-44`), which exists to rewrite a relation that was seeded as
`none` while its owner was a new record once the owner acquires a key.

Rails' `AssociationRelation`
(`vendor/rails/activerecord/lib/active_record/association_relation.rb`) has none
of this: it is `proxy_association`, `==`, the six bulk-insert guards, `_new` /
`_create` / `_create!` and `exec_queries`. A new-record owner produces a `none`
scope in `AssociationScope`/`Association#scope`
(`associations/association.rb:...`), and Rails resets it through
`Association#reset_scope` rather than rebasing a live relation in place.

RFC 0130's receipt pass tagged `rebaseNewOwnerSeed`
`@noRailsEquivalent CONVERGEABLE <this story>`.

## Acceptance criteria

- The rebase is removed: `new-owner-seed-rebase.ts` is deleted along with
  `_maybeRebaseAssociationSeed`, `_seededNoneNewOwner`, `_seedWherePredicates`
  and the `isNullRelation` override in `association-relation.ts`.
- The behaviour those fields protected is obtained the Rails way — the
  association's own `resetScope` / re-derived scope — or shown to be untested
  trails-only behaviour and dropped.
- The association suites stay green on all three adapter lanes.
- `association-relation.ts` and `associations/` report no new novel names and
  the extra-surface mark is tightened.
