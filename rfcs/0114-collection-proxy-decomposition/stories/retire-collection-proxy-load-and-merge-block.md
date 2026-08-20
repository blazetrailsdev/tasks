---
title: "Retire the proxy's load/merge block; load_target and merge_target_lists belong to the association"
status: done
updated: 2026-08-20
rfc: "0114-collection-proxy-decomposition"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 6755
claim: "2026-08-20T01:22:34Z"
assignee: "collection-proxy-delegate-leftjoins-without-fix"
blocked-by: null
closed-reason: null
---

## Context

Rails' proxy has no load machinery. `load_target` is
`@association.load_target` (`collection_proxy.rb:44-46`), `records` is
`load_target` (`:1024-1026`), and the merge of persisted rows against in-memory
ones is `CollectionAssociation#merge_target_lists`
(`vendor/rails/activerecord/lib/active_record/associations/collection_association.rb:335-352`).

`packages/activerecord/src/associations/collection-proxy.ts` carries **95 code
lines** of its own:

- `_execLoad` (`:704`, 10) — "shared execution core for `toArray()` and
  `load()`", with a `queryExecutor` callback threaded through `findTarget`
- `_findTargetViaAssociation` (`:729`, 9)
- `toArray` (`:742`, 7) and `load` (`:775`, 14) — two entry points for what
  Rails spells once
- `_mergeTargetLists` (`:825`, 16) — a **second copy** of
  `mergeTargetLists`, which already exists at
  `packages/activerecord/src/associations/collection-association.ts:1333`
- `_refreshUnchangedAttributes` (`:853`, 13) — no Rails counterpart
- `_identityFor` (`:878`, 10) — Rails is `record_identity`
  (`collection_association.rb`, ported at `collection-association.ts:1271`)
- `_staleWrapper` (`:902`, 6), `_hydrateFromPreload` (`:498`, 5)

Open sibling stories on the same cluster (dependencies / coordination, not
duplicates): `0075-collection-association-target-fidelity/retire-collection-proxy-query-executor-flag`
(retires the `_queryExecutor` flag `_execLoad` threads),
`.../hoist-mid-load-guard-to-doasyncfindtarget-callers`,
`.../collection-proxy-toarray-caches-target-for-replace`,
`.../retire-sync-association-instance-stale-hook` (the `_staleWrapper` half).

## Converged shape

`loadTarget()` / `records()` delegate to the association's `loadTarget`; the
merge, the identity function and the preload hydration are the association's
single copies. `toArray()` and `load()` collapse onto one path — Rails has one.
`_refreshUnchangedAttributes` either maps to a Rails behaviour (name it and cite
it) or is deleted; it may not survive as an untagged invention.

Because the `_queryExecutor` flag is owned by an open 0075 story, this story may
land the delegation with the flag still present and note the residue, **or** be
scheduled after it — but it may not close by keeping a second merge copy.

## Acceptance criteria

- `_mergeTargetLists` and `_identityFor` no longer exist in
  `collection-proxy.ts`; callers use `collection-association.ts`'s
  `mergeTargetLists` / `recordIdentity`.
- `loadTarget()` and `records()` are delegations to the association.
- `toArray()` and `load()` share one body, or one is deleted.
- `_refreshUnchangedAttributes` is deleted, or carries a Rails `file:line` in
  its JSDoc naming the behaviour it ports.
- `pnpm parity:api:calls` / `:args` add zero rows for this file.
- Existing suites pass unchanged, incl. `merge-target-lists.trails.test.ts`,
  `collection-shared-target.trails.test.ts`,
  `singular-reader-stale-target.test.ts`. No test renamed.
