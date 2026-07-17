---
rfc: "0067-predicate-builder-fidelity"
title: "PredicateBuilder fidelity"
status: draft
created: 2026-07-17
updated: 2026-07-17
owner: "@deanmarano"
packages:
  - "activerecord"
clusters:
  - "predicate-builder"
related-rfcs:
  - "0023-surfaced-deviations"
---

# RFC 0067 — PredicateBuilder fidelity

## Summary

Converge trails' `PredicateBuilder` (`packages/activerecord/src/relation/predicate-builder*`)
onto Rails' `activerecord/lib/active_record/relation/predicate_builder.rb` and its
handlers. Today several pieces are invented — a `resolveColumn` step Rails has no
equivalent for, a bespoke type-lookup cascade, treating the builder's table as
TableMetadata rather than an Arel::Table — and negation threading diverges from
Rails' WhereClause#invert. This RFC gathers the surfaced PredicateBuilder
deviations into one campaign.

## Motivation

`0023-surfaced-deviations` accumulated ~6 PredicateBuilder stories sharing one
root theme — the builder's column/type resolution and table model drift from
Rails' — tracked individually. Concrete instances: `resolveColumn` is invented;
the type-lookup cascade is invented rather than Rails' `type_for_attribute` route;
the builder's `table` is an Arel::Table in Rails but TableMetadata in trails;
`where` value pre-casts eagerly where Rails defers; negation threads differently
from `WhereClause#invert`.

## Design

Port each divergent step to its Rails counterpart, routing column/type resolution
through the Rails cascade (`predicate_builder.rb` → `type_for_attribute`), modeling
the builder table as Arel::Table, and threading negation through the WhereClause
invert path. Each story cites the Rails `file:line` and keeps `api:compare` green
for predicate_builder.

## Non-goals

- **Relation query-methods** (relation-_/spawn-_ stories) beyond the predicate
  path itself — those stay in 0023.

## Alternatives considered

- **Leave in 0023:** rejected — the invented-surface theme and the shared
  resolution cascade are invisible scattered across a catch-all.

## Rollout

1. Resolution cascade — unify-predicate-builder-type-resolution-cascades (ready),
   predicate-builder-type-lookup-cascade-is-invented,
   predicate-builder-resolvecolumn-is-invented.
2. Table model — predicate-builder-table-is-arel-table-not-tablemetadata.
3. Negation + defer — predicate-builder-negation-threading-vs-whereclause-invert,
   relation-where-value-eager-precast-vs-rails-defer.

## Verification

Every migrated story converges to its Rails `file:line` with `api:compare` green
for predicate_builder, and this RFC's open-story count reaches zero.

## Open questions

1. **Scope of the resolution cascade.** Recommendation: converge onto Rails'
   `type_for_attribute` route; defer any TypeMap-shape questions to their own story.

## Stories

Migrated from 0023-surfaced-deviations; see the tasks index for the live list.

## Changelog

- Initial RFC: gather surfaced PredicateBuilder deviations from 0023.
