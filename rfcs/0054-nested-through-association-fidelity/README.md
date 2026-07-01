---
rfc: "0054-nested-through-association-fidelity"
title: "Nested/through association direct-load fidelity"
status: draft
created: 2026-07-01
updated: 2026-07-01
owner: "@deanmarano"
packages:
  - "activerecord"
clusters:
  - "rails-deviation"
  - "followup"
related-rfcs:
  - "0023-surfaced-deviations"
---

# RFC 0054 — Nested/through association direct-load fidelity

## Summary

Converge the has_many/has_one `:through` direct-load path
(`packages/activerecord/src/associations/nested-through-associations.ts`) onto
Rails so nested-through reads match the preload/joins paths. Extracted from
`0023-surfaced-deviations`; all members surfaced from the same
`nested-through-associations.test.ts` port.

## Motivation

RFC 0019 canonical-schema burndown of `nested-through-associations.test.ts` left
several cases skipped: the direct-load path diverges from preload/joins for habtm
source reflections, PK dedup, polymorphic source FK column selection, and
intermediate-table scope columns in subquery context. 0040
(through-association source convergence) is closed and covered reflection
resolution, not these direct-load reads.

## Design

- habtm source reflection direct-load returns the correct records (currently
  empty).
- direct-load returns the full multiset (no PK dedup) matching Rails.
- polymorphic source direct-load generates the correct FK column.
- through scope referencing an intermediate-table column resolves in subquery
  context.
- singular through-association statement cache; through-preload raw-SQL condition
  relocation uses structural attribution, not a text-qualifier scan.

## Non-goals

- **JoinDependency internal state model:** owned by 0027-join-dependency-fidelity.
- **Source/polymorphic reflection resolution:** already shipped under closed 0040.

## Rollout

1. `nested-through-habtm-direct-load-empty`,
   `nested-through-pk-dedup-in-direct-load`
2. `nested-through-polymorphic-fk-direct-load`,
   `nested-through-scope-column-alias-subquery`
3. `through-singular-association-statement-cache`,
   `preloader-through-rawsql-condition-text-attribution`

## Verification

The skipped `nested-through-associations.test.ts` cases un-skip and pass on all
lanes; direct-load, preload, and joins agree.

## Open questions

None outstanding.

## Stories

See `pnpm tasks list --rfc <this-rfc>`.

## Changelog

- 2026-07-01: initial RFC — extracted from 0023-surfaced-deviations.
