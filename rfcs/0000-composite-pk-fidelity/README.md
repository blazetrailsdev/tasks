---
rfc: "0000-composite-pk-fidelity"
title: "Composite primary-key fidelity"
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

# RFC — Composite primary-key fidelity

## Summary

Converge composite-primary-key handling across relation materialization,
fixtures, and finders so multi-column PK models behave like Rails. Extracted from
`0023-surfaced-deviations`; the members share the composite-PK surface
(tuple finders, fixture seeding, eager materialization).

## Motivation

Composite-PK support was ported incrementally and several branches remain
single-column-PK only, surfacing as `NotImplementedError` throws or wrong SQL for
composite models. These deviations accumulated in the catch-all with no dedicated
home.

## Design

- Fixtures: seed model composite-PK columns (e.g. `shop_id`) like Rails'
  `composite_identify`; resolve composite fixture refs.
- Finders: `find_with_ids` compacts + uniqs composite-PK tuple lists; readback of
  a non-`id` composite identity column on PostgreSQL.
- Relation: hydrate load-target + `delete_through` for composite PK; fix the
  eager pluck / cache_version composite path.

## Non-goals

- **JoinDependency composite-source joins:** the join-dependency bail on composite
  source PKs (`join-dependency.ts:263`) is tracked under 0027-join-dependency-fidelity;
  this RFC covers the reachable relation/finder/fixture gaps only.

## Rollout

1. Test infra: `fixtures-seed-composite-pk-columns-single-id-table`,
   `cpk-composite-fixture-ref-resolution`
2. Finders/readback: `find-with-ids-compact-uniq-composite-pk-tuples`,
   `composite-pk-custom-named-identity-readback-pg`,
   `toarray-load-target-hydrate-and-deletethrough-composite-pk`
3. Eager materialization: `composite-pk-distinct-relation-materialization`
   (blocked — premise superseded; carry its successor
   `composite-pk-eager-pluck-cache-preload-degrade` here when filed).

## Verification

Composite-PK model tests pass on all lanes with no `NotImplementedError` on the
reachable finder/relation/fixture paths.

## Open questions

1. **Superseded blocked story.** `composite-pk-distinct-relation-materialization`
   is blocked/unreachable; file and adopt its reachable successor before closing.

## Stories

See `pnpm tasks list --rfc <this-rfc>`.

## Changelog

- 2026-07-01: initial RFC — extracted from 0023-surfaced-deviations.
