---
title: "resolve-duplicate-declaration-owners-one-body-two-seats"
status: done
updated: 2026-08-17
rfc: "0108-call-gate-false-positives"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6676
claim: "2026-08-17T23:20:47Z"
assignee: "resolve-duplicate-declaration-owners-one-body-two-seats"
blocked-by: null
closed-reason: null
---

## Context

Measured while implementing `resolve-owner-by-static-and-include-graph-instead-of-skipping`
(PR for RFC 0108). That story landed the two resolutions it names — the include
graph (`includeGraphHosts`, `scripts/api-compare/include-graph.ts`) and the
class/instance SEAT (`tsOwnerSeat` / `rubyOwnerSeat`, `scripts/api-compare/compare.ts`)
— but they recover only **+1** comparison on the current population, not the
107 the story measured on PR #6659.

The reason: most of the `ambiguousTsOwner` population is NOT two different
declarations at all. It is ONE body declared twice — a top-level `export function`
plus a grouping object that re-exports the very same function, which is the
trails mixin convention (CLAUDE.md "Module mixins"):

```ts
// time-ext.ts
export function toTime(this: Date) { … }
export const TimeExt = { toTime, change, since };
```

`tsOwnersByFileName` then holds `{"", "TimeExt"}` for `toTime`, `resolveTsOwner`
cannot name one, and `ambiguousTsOwner` records nothing — even though BOTH
owners carry the identical call-set, so the comparison is well defined whichever
is picked.

Measured, by relaxing `resolveTsOwner` to resolve that shape (branch
`closure-resolves-foreign-receiver-calls-as-same-file-me-0bf3`, artifact
regenerated with `API_COMPARE_FORCE=1 pnpm parity:api --calls`):

- comparisons: 5583 → **5828** (+245 call-set pairs, +25 call-argument sites)
- new call-mismatch rows: **40**, in activesupport (time-ext.ts 12,
  enumerable-utils.ts 6, core-ext/file/atomic.ts 4, deprecation/method-wrappers.ts 3,
  core-ext/digest/uuid.ts 2, array-utils.ts 2, transliterate.ts 1,
  xml-mini/nokogiri.ts 1), activerecord (connection-handling.ts 5,
  persistence.ts 1 — `_update_record` → `attributes_for_update`, the story's own
  example), activemodel (attribute-registration.ts 1), rack (utils.ts 2).

That 40-row burndown across 12 files is a PR of its own, which is why it was
split out rather than bundled.

Note the resolution must NOT be "pick either owner when several declare the
name". A looser rule mispairs: `time-ext.ts` also holds one `toTime` body for
`Time#to_time`, `Date#to_time` and `DateTime#to_time`, and the seat arm was
deliberately gated on the RUBY file posing a seat question (`rubySeats.size > 1`,
`resolveTsOwner`) to keep it from choosing between unrelated classes.

## Acceptance criteria

- `resolveTsOwner` resolves the case where every TS owner declaring the name in
  a file records the SAME call-set (one body, two declarations) — provably safe,
  since the comparison is identical whichever owner is picked. It must not
  resolve owners whose call-sets differ.
- Comparisons rise by ~245 (report the measured number in the PR body).
- The rows that surface are converged, or baselined with a reviewed one-line
  reason carrying a Rails `file:line`.
- `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green.
- `scripts/api-compare` unit tests cover the resolution and the mispairing it
  must refuse.
