---
title: "Let @noRailsEquivalent receipts on internal declarations subtract in the privates lane"
status: ready
updated: 2026-11-04
rfc: "0218-api-privates-extra-surface"
cluster: api-compare
packages: []
deps: [privates-surface-report]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The RFC's Design, "Receipts". The public lane's STALE check
(`gateStale`, `scripts/api-compare/extra-surface.ts:3265-3277`) rejects a receipt on any
internal or `_` name, because that lane never counts it; RFC 0025's draft
story `allow-no-rails-equivalent-tags-on-private-members` records the failure
on `relation.ts`'s `_loadAsyncPromise`, `_asyncLoad`, `_loadToken`.
`internalJsDocTagApplies` (`scripts/api-compare/extract-ts-api.ts:2987-3010`)
already moves a JSDoc-`@internal` declaration with a receipt into the public
lane (RFC 0121), so it must not be scored here as well. `collectTaggedEntries`
(`extra-surface.ts:735-815`) is the tag collector to reuse.

## Acceptance criteria

- A `@noRailsEquivalent PERMANENT|CONVERGEABLE` receipt on a privates
  population declaration moves it to `allowed`.
- A receipt on a population name that would be `credited` is STALE in this
  lane and exits non-zero, with the same message shape as the public lane.
- The public lane stops reporting a receipt as STALE when the privates lane
  reads it, and still reports one that neither lane reads; tests cover both.
- A JSDoc-`@internal` declaration carrying a receipt is scored in the public
  lane only (test).
