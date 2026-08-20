---
title: "Move the proxy's through owner-attribute derivation into ThroughAssociation/AssociationScope"
status: claimed
updated: 2026-08-20
rfc: "0114-collection-proxy-decomposition"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: "2026-08-20T00:22:32Z"
assignee: "load-async-sets-loaded-so-loaded-readers-drain-the-future"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/lib/active_record/associations/collection_proxy.rb`
mentions `:through` only in documentation comments — it holds no
through-specific code, because every call goes to `@association` and
`HasManyThroughAssociation` is what answers.

`packages/activerecord/src/associations/collection-proxy.ts` carries a
through subsystem. This story takes the **owner-attribute derivation** half,
**89 code lines**:

- `_throughOwnerCols` (`:1256`, 35) — derives the join model's owner FK
  columns; Rails is `ThroughAssociation#construct_join_attributes` /
  `AssociationScope`'s owner key handling
  (`vendor/rails/activerecord/lib/active_record/associations/through_association.rb`,
  `.../association_scope.rb`).
- `_throughOwnerPolymorphic` (`:1317`, 43) — the `<as>_type` derivation;
  Rails does this in `construct_join_attributes` off
  `source_reflection.options[:as]`.
- `_throughOwnerAttrs` (`:1378`, 11) — assembles the pair.
- `_resolveThroughModel` (`:2074`, 9) — Rails reads
  `through_reflection.klass`.

Destinations already exist:
`packages/activerecord/src/associations/through-association.ts`,
`.../has-many-through-association.ts`, `.../association-scope.ts`.

Note the sibling open story
`0111-error-class-message-parity/through-owner-cols-raises-bare-error-not-composite-pk-mismatch`
targets the raise inside `_throughOwnerCols`. Coordinate: if that story lands
first, move the corrected raise; if this lands first, the raise moves with the
body and that story retargets. Do not fix both in one PR.

`_buildThroughScope` (`:2233`, 110 lines) is explicitly **not** in this story —
it is owned by
`0023-surfaced-deviations/converge-collection-proxy-through-scope-builder-to-association-scope`.
`_pushThrough` (`:1418`) is owned by
`0023-surfaced-deviations/retire-push-through-for-association-concat`.

## Converged shape

Move each body to the Rails file that owns it, at the Rails name, and have the
through association call it. The proxy keeps no through-specific member from
this set. Do not introduce a shared helper that both files call — Rails has one
site, so trails has one site.

## Acceptance criteria

- `_throughOwnerCols`, `_throughOwnerPolymorphic`, `_throughOwnerAttrs`,
  `_resolveThroughModel` no longer exist in `collection-proxy.ts`.
- Their behaviour lives in `through-association.ts` /
  `has-many-through-association.ts` / `association-scope.ts` under the Rails
  name for the Rails method that performs it, cited in the JSDoc.
- No new `@noRailsEquivalent` tag and no new baseline row anywhere.
- `pnpm parity:api:calls` / `:args` add zero rows for
  `associations/collection-proxy.ts` and no rows for the destination files.
- Existing suites pass unchanged, incl. `has-many-through-associations.test.ts`,
  `nested-through-associations.test.ts`,
  `through-association-scope-composite-pk.trails.test.ts`,
  `polymorphic-sti-through.test.ts`. No test renamed.
