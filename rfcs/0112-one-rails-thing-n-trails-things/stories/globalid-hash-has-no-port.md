---
title: "GlobalID#hash and URI::Generic#hash have no trails port"
status: closed
updated: 2026-08-31
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Closed on the story's own escape clause and on RFC 0112 charter. The story says: 'if the reviewer judges an unconsumed hash to be invented surface in TS, block this story rather than inventing a hashing convention'. JS has no Object#hash protocol — Map/Set key on identity — so a ported GID#hash / GlobalID#hash would have zero runtime consumers and zero behavioural coverage; the equality half that DOES matter already landed in PR #7136 (GID#equals mirroring uri/generic.rb:1396-1402, routed through GlobalID#equals / SignedGlobalID#equals). Verified still absent on origin/main: git grep -n hash origin/main -- packages/globalid/src/global-id.ts packages/globalid/src/uri/gid.ts finds only a doc comment at gid.ts:293. It is also off-charter here: 0112 is 'one Rails thing, N trails things' (duplicate bodies / split stores); this is a missing port with no duplication, so it has no home in this RFC. Re-file against a globalid fidelity RFC if an actual consumer for a hash protocol ever appears."
---

## Context

PR #7136 (`gid-has-no-structural-equality`) ported `URI::Generic#==` onto `GID`
and routed `GlobalID#equals` / `SignedGlobalID#equals` through it. The `hash`
half of Ruby's `eql?`/`hash` contract was left unported, so two GlobalIDs that
are now correctly `equals` still have no shared hash.

Rails has both, and they are defined together:

- `GlobalID#hash` — `self.class.hash | @uri.hash`
  (`vendor/globalid/lib/global_id/global_id.rb:72-74`), sitting directly under
  `==` / `alias_method :eql?, :==` (`:67-70`).
- `URI::Generic#hash` — `component_ary.hash`
  (Ruby stdlib `uri/generic.rb:1404-1406`), the component-wise twin of the
  `==` at `:1396-1402` that `GID#equals` already mirrors.

trails has neither: `grep hash packages/globalid/src/global-id.ts
packages/globalid/src/uri/gid.ts` finds only an unrelated doc comment.

This matters because the partition is already computed. `GID#equals`
(`packages/globalid/src/uri/gid.ts`) compares `app` (downcased, per
`normalize!` at `uri/generic.rb:1340-1350`), `modelName`, `modelId` and
`params` — exactly the components a faithful `hash` must fold over, and the
downcasing is the part a naive `hash` over `toString()` would get wrong.

## Converged shape

- `GID#hash` folds the same four components `equals` compares, with `app`
  downcased so `gid://App/Person/1` and `gid://app/Person/1` — equal since
  #7136 — hash equal too.
- `GlobalID#hash` mirrors `global_id.rb:72-74` over that.
- `SignedGlobalID` follows whatever `signed_global_id.rb` does, checked at
  port time rather than assumed.

Note JS has no `Object#hash` protocol, so this is a plain method with no
runtime consumer (`Map`/`Set` key on identity). File it as fidelity surface,
not as a behaviour fix; if the reviewer judges an unconsumed `hash` to be
invented surface in TS, `block` this story with that reasoning rather than
inventing a hashing convention for it.

## Acceptance criteria

- [ ] `GID#hash` mirrors `uri/generic.rb:1404-1406` over the components
      `equals` uses, with `app` downcased.
- [ ] `GlobalID#hash` mirrors `global_id.rb:72-74`.
- [ ] Equal-per-`equals` GlobalIDs hash equal, including the `App`/`app` case.
- [ ] `pnpm parity:api --package globalid` does not regress from 80/80.
