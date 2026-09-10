---
title: "Measure the PG type-map staleness gap and recommend async lookups or a warmed type map"
status: ready
updated: 2026-09-10
rfc: "0145-async-on-demand-adapter-lookups"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0145 Phase 1. Its three stories all stall on one question no story is
allowed to answer on its own: Rails resolves these lookups with a live query,
and trails made each path synchronous by a merged, reviewed decision
(`pg-fetch-type-metadata-async-forces-a-union-on-the-abstract`, and
`pg-lookup-cast-type-async-divergence` as PR 7223). Converging means reverting
one of those; ratifying is not an available outcome. So the cluster needs a
measurement and a recommendation before any of the three can move.

The two candidate answers, from the RFC:

- **A — go async.** `getOidType` and `lookupCastType` become async, taking
  `fetch_type_metadata`, `cast_result` and `new_column_from_field` with them.
- **B — warm the type map at Rails' own discovery points**, so the on-demand load
  is never needed and the sync signatures stand.

This story produces the evidence to choose, not the choice itself: the size of
A's blast radius, and whether B can be pinned to Rails' discovery points without
inventing the `CREATE TYPE` / `CREATE DOMAIN` sniffing that option 1 of
`pg-lookup-cast-type-misses-types-created-after-the-type-map-load` was already
rejected for.

## Acceptance criteria

- [ ] The call-site count and file list for an async `getOidType` and an async
      `lookupCastType`, transitively — every caller that would have to await,
      including the `fetch_type_metadata` / `cast_result` /
      `new_column_from_field` chain.
- [ ] A failing test that pins the actual behavioral gap: a type created after
      the type map loaded, resolved through `lookupCastType` (Rails'
      `postgresql/quoting.rb:194-196` issues `SELECT <type>::regtype::oid` per
      call), and one through `getOidType` needing `load_additional_types`.
      It must fail on baseline.
- [ ] For option B: the enumerated points at which Rails' own type map can go
      stale, each with a `vendor/rails` `file:line` — or a statement, with
      evidence, that they cannot be enumerated without sniffing SQL text.
- [ ] A written recommendation of A or B in RFC 0145's Design section, with the
      measurements inline.

## Definition of done

A recommendation without the failing test does not close this story — the gap
has to be pinned before it is traded against a signature. Choosing A or B is
the user's call to ratify; this story ends at the recommendation.

## Verification

`pnpm vitest run` over the new failing test on the PG lane (baseline red), plus
the grep/`tsc` output backing the transitive await list.

## Notes

Both merged decisions chose sync to preserve Rails' signature, before the
behavioral gap was measured. That is why re-opening them is legitimate rather
than churn — but it is also why the measurement has to come first.
