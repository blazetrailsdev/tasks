---
title: "GID has no URI::Generic#== port, so GlobalID#equals compares string forms"
status: in-progress
updated: 2026-08-27
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 7136
claim: "2026-08-27T20:13:47Z"
assignee: "sqlite-structure-load-in-memory-lane-decision"
blocked-by: null
closed-reason: null
---

## Context

Rails' `GlobalID#==` is `other.is_a?(GlobalID) && uri == other.uri`
(`vendor/globalid/lib/global_id/global_id.rb:67-68`) — it compares the two
`URI::GID` objects through `URI::Generic#==`, which is component-wise
(scheme, host, path, query), not a string compare.

`URI::GID` is `class GID < URI::Generic` (`vendor/globalid/lib/global_id/uri/gid.rb:7`).
trails' `GID` (`packages/globalid/src/uri/gid.ts:195`) has no structural
equality at all, so PR #7073 — which converged `GlobalID#uri` onto the parsed
`GID` — had to spell the comparison as
`this.uri.toString() === other.uri.toString()`
(`packages/globalid/src/global-id.ts`, `equals`), with the same shape in
`SignedGlobalID#equals` (`packages/globalid/src/signed-global-id.ts`). Both
carry a JSDoc note recording why; that note is the receipt for this story, not
a settled decision.

The string form induces the same partition today (every GID component is
recoverable from `to_s`), so this is a fidelity gap rather than a behavior bug.

## Converged shape

Give `GID` the `URI::Generic#==` port — component-wise equality over the
fields `GID` actually carries — and have `GlobalID#equals` /
`SignedGlobalID#equals` call it, deleting the two `toString()` JSDoc notes
rather than rewording them.

## Acceptance criteria

- [ ] `GID` answers structural equality mirroring `URI::Generic#==`.
- [ ] `GlobalID#equals` and `SignedGlobalID#equals` compare `GID`s, not strings.
- [ ] The two call-site JSDoc notes added by PR #7073 are removed.
- [ ] globalid suite green; `pnpm parity:api --package globalid` stays 80/80
      with no new extra surface.
