---
title: "Inverse-of error wording + dead-code hygiene"
status: ready
rfc: "0005-activerecord-gaps"
cluster: associations
deps: []
deps-rfc: []
est-loc: 60
priority: 25
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Small hygiene bundle: align inverse-of error strings to Rails wording, fix/remove
the broken `_hasAttribute` instance method, wire `initInternals` in `core.ts`
(currently dead code), and correct the stale JSDoc in `inheritance.ts`
`initializeInternalsCallback` (claims the callback isn't wired, but it is —
`base.ts:2331,2375`).

## Acceptance criteria

- [ ] Inverse-of error strings match Rails wording
- [ ] Broken `_hasAttribute` instance method fixed or removed
- [ ] `initInternals` wired in `core.ts` (no longer dead)
- [ ] Stale `initializeInternalsCallback` JSDoc corrected in `inheritance.ts`

## Notes

From the associations gap plan (Round-4 follow-up + stale-JSDoc note), ready now.
