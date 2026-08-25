---
title: "Call-argument gate drops a twice-declared body before consulting the resolved owner"
status: done
updated: 2026-08-18
rfc: "0108-call-gate-false-positives"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6679
claim: "2026-08-17T23:58:00Z"
assignee: "converge-collection-proxy-size-onto-association"
blocked-by: null
closed-reason: null
---

## Context

Measured while implementing `resolve-duplicate-declaration-owners-one-body-two-seats`
(PR #6676). That story predicted the new owner-resolution arm would recover
call-set pairs AND ~25 call-ARGUMENT sites. It recovered +178 call-set pairs
(5583 → 5761) and **zero** argument sites (5556 → 5556).

The reason is a second, independent guard in the call-argument gate, not the
owner resolution. `checkCallArgs` in `scripts/api-compare/compare.ts` bails
with:

```ts
const tsSites = tsCallArgsByFileName.get(tsFile)?.get(tsName);
if (tsSites?.length !== 1) return;
```

`tsCallArgsByFileName` is keyed (file → name) and holds ONE ENTRY PER
DECLARATION, so the one-body-two-declarations shape this RFC's owner arm now
resolves — the trails mixin convention of a top-level `export function` plus a
grouping object re-exporting the same function (`export function toTime()`
beside `export const TimeExt = { toTime }`, CLAUDE.md "Module mixins") — always
records `length === 2` and is dropped before the resolved owner is consulted.
The guard predates the owner resolution and was written when "two entries" could
only mean two genuinely different overloads.

The owner-resolved population is already available at that point: `resolveOwner`
runs a few lines above (it is shared with `checkCalls`), and
`tsCallArgsByFileNameOwner` is populated per (file, name, owner) exactly as
`tsCallsByFileNameOwner` is.

## Acceptance criteria

- `checkCallArgs` consults the owner-scoped sites (`tsCallArgsByFileNameOwner`
  under the resolved `tsClass`) rather than requiring exactly one whole-file
  entry, so a twice-declared single body compares its argument lists. Keep the
  bail for a genuinely ambiguous owner — the guard's original purpose.
- Report the measured rise in "Call args (advisory): N call sites compared"
  in the PR body (the story that surfaced this predicted ~25).
- New `kind: "args"` rows are converged, or baselined with a reviewed one-line
  reason carrying a Rails `file:line`.
- `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green.
- `scripts/api-compare` unit tests cover a twice-declared body whose argument
  lists now compare, and an ambiguous owner that must still bail.
