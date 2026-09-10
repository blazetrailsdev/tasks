---
title: "Enumerate Rails' PG type-map discovery points and warm trails' type map at each"
status: closed
updated: 2026-09-10
rfc: "0145-async-on-demand-adapter-lookups"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: "2026-09-10T18:19:24Z"
assignee: "measure-the-pg-type-map-staleness-gap"
blocked-by: null
closed-reason: "RFC 0145 decision (user, 2026-09-10): a PG type created by raw execute or by another session after the type-map load is out of ActiveRecord's API on both sides. Rails' own DDL paths all reload_type_map (postgresql_adapter.rb:478,489,559,575,584,602,615) plus configure_connection (:996), and trails mirrors every one; the live ::regtype (quoting.rb:196) and load_additional_types([oid]) (:856) only recover from out-of-API staleness. getOidType/lookupCastType stay sync; no warming beyond the 8 points."
---

## Context

RFC 0145 Phase 1. Its three stories all stall on the same shape: Rails resolves
these lookups with a live query, and trails made each path synchronous by a
merged, reviewed decision
(`pg-fetch-type-metadata-async-forces-a-union-on-the-abstract`, and
`pg-lookup-cast-type-async-divergence` as PR 7223).

**The RFC has decided the direction: option B — warm the type map so the
on-demand load is never needed.** The sync signatures stand, the merged
decisions are not reverted, and the behavioral gap closes by reloading trails'
type map wherever Rails would have discovered a new OID.

Rails' live query is recovery from staleness, not the interesting part:
`lookup_cast_type` issues `SELECT <type>::regtype::oid` per call
(`postgresql/quoting.rb:194-196`), and `get_oid_type` falls back to
`load_additional_types([oid])`. A type map that is not stale reaches the same
answer without either.

This story does the enumeration and the warming. It is the whole of Phase 1;
`pg-get-oid-type-drops-the-on-demand-load-additional-types` and
`pg-lookup-cast-type-misses-types-created-after-the-type-map-load` unblock on it.

## Acceptance criteria

- [ ] A failing test that pins the actual gap, red on baseline: a type created
      after the type map loaded, resolved through `lookupCastType`; and an OID
      resolved through `getOidType` that today needs `load_additional_types`.
- [ ] Every point at which Rails' PG type map can go stale is enumerated, each
      anchored to a `vendor/rails` `file:line`.
- [ ] trails reloads its type map at each of those points, and the tests above
      pass with `getOidType` and `lookupCastType` still synchronous.
- [ ] No new `@missingRailsCall` receipt for `load_additional_types` or the
      `regtype` query, and the existing ones are deleted rather than reworded.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` are green with no
      new baseline row.

## Definition of done

Sniffing raw `execute` for `CREATE TYPE` / `CREATE DOMAIN` does not close this
story. That is the invented mechanism option 1 of
`pg-lookup-cast-type-misses-types-created-after-the-type-map-load` was rejected
for — Rails has no counterpart for it, in the one method whose Rails body is
`super ensure @notice_receiver_sql_warnings = []`.

Making either method async does not close this story either; that is option A,
which the RFC did not choose.

If the discovery points genuinely cannot be enumerated without sniffing SQL
text, that falsifies option B. Stop, `tasks block` this story with the
enumeration attempt as evidence, and escalate to RFC 0145 — do not fall back to
A inside this story.

## Verification

`pnpm vitest run` over the new tests on the PG lane (red on baseline, green
after), plus `pnpm parity:api:calls` and `pnpm parity:api:calls:args`.

## Notes

Both merged decisions chose sync to preserve Rails' signature. B keeps that
choice and supplies the freshness guarantee that was missing behind it, which is
why it converges rather than trading one deviation for another.
