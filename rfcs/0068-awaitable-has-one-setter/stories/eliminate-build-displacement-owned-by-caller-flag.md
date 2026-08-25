---
title: "Eliminate the buildDisplacementOwnedByCaller suppression flag"
status: done
updated: 2026-08-03
rfc: "0068-awaitable-has-one-setter"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
pr: 5991
claim: "2026-08-03T16:51:42Z"
assignee: "eliminate-build-displacement-owned-by-caller-flag"
blocked-by: null
closed-reason: null
---

## Context

`HasOneAssociation#buildDisplacementOwnedByCaller`
(`packages/activerecord/src/associations/has-one-association.ts`) is a trails
invention: a mutable flag a caller sets around `build` to suppress the
association's own `load_target` (`loadDisplacedForBuild`) and `remove_target!`
(`detachDisplacedOnBuild`). Rails has no such flag — `replace` always runs both.

PR #5663 removed its second caller: the nested-attributes writer now runs
`buildRecord` / `setNewRecord` separately (Rails' own two halves,
`singular_association.rb:29-31`) and so never enters `build`. One caller
remains:

- `buildThroughProxyRecord` (`associations/has-one-through-association.ts:791`),
  which rebuilds a has_one_through's join record on the through proxy. The proxy
  is itself a has_one association, but Rails' `create_through_record`
  (`vendor/rails/activerecord/lib/active_record/associations/has_one_through_association.rb:15-40`)
  — not `SingularAssociation#build` — owns the join row's displacement, loading
  the proxy and updating/destroying the existing row. Letting the proxy's own
  build query would duplicate that load and make the synchronous reconstruction
  return a promise.

The same trick the nested-attributes writer now uses should retire the flag:
call the proxy's `buildRecord` + `setNewRecord` directly instead of `build`,
which never reaches the load/removal in the first place and needs no suppression
state. Once that lands, the flag and both of its guard clauses
(`loadDisplacedForBuild`, `detachDisplacedOnBuild`) delete.

## Acceptance criteria

- [ ] `buildDisplacementOwnedByCaller` is gone, along with its two early-return
      guards in `loadDisplacedForBuild` and `detachDisplacedOnBuild`.
- [ ] `buildThroughProxyRecord` reaches the same in-memory result without a
      suppression flag, and stays synchronous.
- [ ] `has-one-through-associations.test.ts`,
      `has-one-through-build.trails.test.ts` and
      `has-one-sync-build-displacement.trails.test.ts` pass unchanged.
- [ ] `pnpm parity:api:extra` for `associations/has-one-association.ts` drops by one
      novel name.
