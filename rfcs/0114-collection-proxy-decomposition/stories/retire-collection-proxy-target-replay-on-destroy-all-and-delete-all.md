---
title: "destroy_all/delete_all replay association state by hand; _invalidateAssociationIds has no Rails counterpart"
status: claimed
updated: 2026-08-20
rfc: "0114-collection-proxy-decomposition"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: "2026-08-20T01:52:31Z"
assignee: "derive-collection-proxy-delegate-list-from-mixin-keys"
blocked-by: null
closed-reason: null
---

## Context

Three proxy bodies replay association state by hand instead of letting the
association own it:

- `destroyAll()` (`packages/activerecord/src/associations/collection-proxy.ts:2089`,
  6 lines) loads via `toArray()`, calls `destroy(...records)`, then
  `_invalidateAssociationIds()`. Rails is
  `@association.destroy_all.tap { reset_scope }`
  (`vendor/rails/activerecord/lib/active_record/associations/collection_proxy.rb:501-503`),
  and `CollectionAssociation#destroy_all`
  (`.../collection_association.rb:172-177`) is what loads, destroys and resets.
  trails already has `CollectionAssociation#destroyAll` at
  `packages/activerecord/src/associations/collection-association.ts:623`.
- `deleteAll(dependent)` (`:2511`, 12 lines) delegates correctly, then hand-replays
  `this._target = []; this._targetLoaded = true; _invalidateAssociationIds();
resetScope()`. Rails' `.tap { reset_scope }` is the whole tail — the target
  reset happens inside the association's `delete_all`, and the proxy reads the
  association's `@target` (`collection_proxy.rb:40-42`).
- `_invalidateAssociationIds()` (`:1430`, 11 lines) has no Rails counterpart at
  all: Rails' `#{singular}_ids` reader is `ids_reader`
  (`collection_association.rb:51-60`), which recomputes from the target every
  call and therefore needs no invalidation hook.

The proxy already reads the association's target through the `_target` accessor
pair (`:196-203`), which is exactly why the manual replay is redundant — the
comment at `:2519` says so in as many words ("The trails CollectionProxy keeps
its own copy of the target, so the same reset has to be replayed on it here"),
but that premise stopped being true when the store was unified.

## Converged shape

- `destroyAll()` → `@association.destroy_all` + `resetScope()`.
- `deleteAll(dependent)` → the association call + `resetScope()`, nothing else.
- `_invalidateAssociationIds` deleted; if any `#{singular}Ids` cache genuinely
  needs invalidating, that cache is the deviation and gets its own filed story
  (Rails has no such cache) — do not keep the hook.

## Acceptance criteria

- `destroyAll` and `deleteAll` in `collection-proxy.ts` are the
  `@association.X.tap { reset_scope }` shape and nothing more.
- `_invalidateAssociationIds` no longer exists in `collection-proxy.ts`; no
  replacement hook is introduced.
- If an ids cache blocks deletion, file it as its own story (this RFC or
  `0023-surfaced-deviations`) with the trails `file:line`, and note the dep —
  do not ratify the hook.
- `pnpm parity:api:calls` / `:args` add zero rows for this file.
- Existing suites pass unchanged, incl. `has-many-associations.test.ts`,
  `collection-proxy.test.ts`, `has-many-through-associations.test.ts`. No test
  renamed.
