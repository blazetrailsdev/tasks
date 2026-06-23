---
rfc: "0040-through-association-source-convergence"
title: "Through-association source/polymorphic reflection convergence"
status: active
created: 2026-06-21
updated: 2026-06-21
owner: "@deanmarano"
packages:
  - "activerecord"
clusters: []
related-rfcs:
  - "0023-surfaced-deviations"
  - "0033-standalone-associations-burndown"
---

## Summary

Converge trails' `has_*  :through` source-reflection resolution onto Rails for
the polymorphic and scoped cases. These four stories were surfaced individually
under RFC 0023 but form one coherent body of work on a single subsystem
(`through_reflection` / `source_reflection` and the SQL it generates), so they
get their own RFC with a shared rollout rather than floating in the deviations
bucket.

## Motivation

Through-association source resolution has several tracked divergences from Rails,
all in how the source reflection's type/scope/foreign-key is derived and applied:

- polymorphic `source_type` is not derived from the polymorphic name,
- a polymorphic source does not apply its type condition,
- the source reflection's scope is not merged into the generated query,
- owner column derivation does not delegate to the reflection.

Each is small on its own, but they share fixtures, the same Rails source
(`activerecord/lib/active_record/reflection.rb`,
`associations/through_association.rb`), and the same trails files
(`packages/activerecord/src/reflection.ts`, `associations/`), so converging them
together avoids repeated context re-derivation and overlapping edits.

## Stories

- `through-belongsto-source-type-uses-polymorphic-name`
- `through-polymorphic-source-applies-type-condition`
- `through-source-reflection-scope-not-merged`
- `through-owner-cols-delegate-to-reflection`

(Authored under 0023; moved here verbatim — bodies already carry Rails/trails
`file:line` and acceptance criteria.)

<!-- generated: stories table -->

| ID                                                                                                                    | Title                                                                                                           | Status      | Est LOC | Cluster |
| --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------- | ------- | ------- |
| [through-source-type-source-scope-not-merged](stories/through-source-type-source-scope-not-merged.md)                 | has_many :through with source_type: drops the polymorphic source reflection's own scope                         | in-progress | 70      | —       |
| [through-belongsto-source-type-uses-polymorphic-name](stories/through-belongsto-source-type-uses-polymorphic-name.md) | createThroughAssociation belongs_to source \_type fallback should use polymorphic_name                          | done        | 40      | —       |
| [through-create-source-type-verbatim-no-fallback](stories/through-create-source-type-verbatim-no-fallback.md)         | createThroughAssociation: write source \_type verbatim from source_type, drop inferred polymorphicName fallback | done        | 50      | —       |
| [through-owner-cols-delegate-to-reflection](stories/through-owner-cols-delegate-to-reflection.md)                     | Delegate \_throughOwnerCols derivation to reflection.foreignKey/activeRecordPrimaryKey                          | done        | 60      | —       |
| [through-polymorphic-source-applies-type-condition](stories/through-polymorphic-source-applies-type-condition.md)     | through-polymorphic-source-applies-type-condition                                                               | done        | null    | —       |
| [through-source-reflection-scope-not-merged](stories/through-source-reflection-scope-not-merged.md)                   | through-source-reflection-scope-not-merged                                                                      | done        | null    | —       |

## Rollout

No hard ordering; ship smallest-first. Each story is independently mergeable and
converges toward Rails (fidelity-first — no deviations are ratified).
