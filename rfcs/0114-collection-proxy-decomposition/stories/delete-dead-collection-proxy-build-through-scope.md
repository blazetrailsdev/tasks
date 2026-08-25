---
title: "_buildThroughScope is dead after the seeding removal; delete the trails-only IN-subquery through builder"
status: done
updated: 2026-08-20
rfc: "0114-collection-proxy-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6753
claim: "2026-08-20T00:22:32Z"
assignee: "load-async-sets-loaded-so-loaded-readers-drain-the-future"
blocked-by: null
closed-reason: null
---

## Context

`CollectionProxy#_buildThroughScope`
(`packages/activerecord/src/associations/collection-proxy.ts:1846-2000`, ~155
lines) is now **unreachable from production code**. Its only caller was the
through-arm of the constructor's relation seeding, deleted by #6745
(`collection-proxy-initialize-is-five-lines`). A grep for the name across
`packages/activerecord/src` returns the definition plus one stale _prose_
mention in a test comment
(`associations/collection-proxy-count.test.ts:228`) — no call site.

The method has no Rails counterpart. Rails builds a through scope exactly one
way: `Association#scope` → `AssociationScope.scope`, the JOIN-based chain walk
(`activerecord/lib/active_record/associations/association_scope.rb:26-40`),
which `reflection.chain` flattens uniformly for nested-through shapes.
`_buildThroughScope`'s first branch already delegates to that
(`_routeThroughViaAssociationScope` → `hasManyScope`); everything after it is a
trails-invented single-column `IN (subquery)` fallback with its own composite-PK
`ConfigurationError` backstops, reached only for shapes the JOIN router
declines (polymorphic has_many sources, unsaved nested-through).

With the seeding gone, the proxy reaches its scope solely through
`scope()` → `@association.scope` (`collection_proxy.rb:949-951`), so the
through path is served by `CollectionAssociation#scope` /
`HasManyThroughAssociation` and this second implementation is dead weight.

## Converged shape

Delete `_buildThroughScope` and the private helpers it alone uses
(`_throughOwnerPolymorphic`, `_throughOwnerCols` — verify each has no other
caller first; note
`move-through-owner-attribute-helpers-to-through-association` in this RFC may
relocate those, so check its state and sequence accordingly).

Fix the stale comment at `collection-proxy-count.test.ts:228`, which describes
the emitted COUNT shape as coming from "our `_buildThroughScope`". The
assertions there (one SQL, a COUNT, not a row-wise SELECT) are shape-agnostic
by construction and should keep passing on the JOIN path; if the emitted SQL
changes from `IN (subquery)` to an explicit JOIN, that is the _converged_
shape and the comment should say so.

If any shape turns out to still depend on the IN-subquery fallback, that is a
gap in `_routeThroughViaAssociationScope` / `AssociationScope`, not a reason to
keep this method — file that gap rather than restoring the fallback.

## Acceptance criteria

- `_buildThroughScope` no longer exists; nor do helpers left callerless by its
  removal.
- No production call site regressed: `has-many-through-associations.test.ts`,
  `habtm.test.ts`, `has-and-belongs-to-many-associations.test.ts`,
  `collection-proxy-count.test.ts`, `nested-through-associations.test.ts` pass
  unchanged. No test renamed.
- The stale `_buildThroughScope` reference in
  `collection-proxy-count.test.ts:228` is corrected.
- `pnpm parity:api:extra --package activerecord` loses the name; no new surface.
- `pnpm parity:api:calls` / `:args` add zero rows.
- `pnpm parity:api` / `pnpm parity:test` deltas non-negative.
