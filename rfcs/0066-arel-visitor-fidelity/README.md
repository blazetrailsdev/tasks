---
rfc: "0066-arel-visitor-fidelity"
title: "Arel visitor & node-surface fidelity"
status: draft
created: 2026-07-17
updated: 2026-07-17
owner: "@deanmarano"
packages:
  - "activerecord"
clusters:
  - "arel-visitor"
related-rfcs:
  - "0017-arel-collector-threading"
  - "0023-surfaced-deviations"
---

# RFC 0066 — Arel visitor & node-surface fidelity

## Summary

Converge trails' Arel layer (`packages/activerecord/src/arel/`) onto Rails'
`activerecord/lib/arel/`: the visitor dispatch, the node type surface, and the
predication/quoting arms. Today several arms are invented (surfaces Rails has no
equivalent for), dispatch on raw JS classes where Rails dispatches on Arel node
types, or duplicate adapter-level encoding inside the visitor. This RFC gathers
the surfaced Arel deviations into one campaign so they converge as a unit rather
than as scattered one-offs in 0023-surfaced-deviations.

## Motivation

`0023-surfaced-deviations` accumulated ~13 Arel-visitor stories that share one
root theme — the trails Arel visitor and node surface drift from Rails' — but were
tracked individually, making it hard to see the shared design or sequence the work.
Concrete instances: `Arel::Nodes` visit dispatches raw classes rather than node
types; `arel-attribute` exposes a coalesce surface Rails lacks; array quoting
duplicates the adapter's `encode_array`; `IN`/`NOT IN` enumerable arms diverge from
Rails' `HomogeneousIn` handling; ValuesList row-casts assert on raw values.

See memory anchors: visitNodeOrValue is RAW-value not casted; unsupported() names
the value's class not the visitor; Rails' Arel does no value formatting.

## Design

Port each divergent arm to its Rails counterpart in `arel/visitors/` and
`arel/nodes/`, dispatching on Arel node type (not JS runtime class), removing
invented surfaces, and pushing adapter encoding back to the adapter's quoting
layer. Each story cites the Rails `file:line` it converges onto and keeps
`api:compare` green for the corresponding arel file.

## Non-goals

- **Arel collector threading:** owned by RFC 0017 (arel-collector-threading).
- **Adapter-level quoting semantics** beyond what the visitor calls into.

## Alternatives considered

- **Leave in 0023:** rejected — the shared design is invisible when the stories
  are scattered in a catch-all, and sequencing (e.g. isNil before per-class
  IS NULL arms) is easy to miss.
- **Fold into RFC 0017:** rejected — 0017 is specifically collector threading;
  node-surface/visitor-dispatch fidelity is a distinct concern.

## Rollout

1. Node-surface convergence — arel-ast-type-surface, arel-attribute-coalesce,
   arel-dot-ishash, arel-valueslist-row-casts.
2. Visitor-dispatch convergence — arel-visit-dispatches-raw-classes,
   abstract-quote-boolean-arms-self-dispatch, converge-arel-array-type-cast.
3. Predication arms — arel-in-not-in-hash, arel-predications-in-not-in,
   arel-right-is-null, grouping-queries-nary-or-vs-binary-or.
4. Test-hygiene — arel-attribute-test-duplicate-it-names,
   insert-manager-valueslist-test-duplicated, arel-quote-array-duplicates,
   table-alias-get-skips-rails-table-branch.

## Verification

Every migrated story converges to its Rails `file:line` with `api:compare` green
for the arel file, and the arel-visitor entry count in this RFC reaches zero open
stories.

## Open questions

1. **Fold vs. new RFC.** Recommendation: new RFC (this one); revisit folding into
   0017 only if the two campaigns end up sharing stories.

## Stories

Migrated from 0023-surfaced-deviations; see the tasks index for the live list.

## Changelog

- Initial RFC: gather surfaced Arel-visitor deviations from 0023.
