---
title: "ar-associations-source-reflection"
status: claimed
updated: 2026-06-24
rfc: "0045-data-layer-api-compare-100"
cluster: ar-feature
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: "2026-06-24T01:30:44Z"
assignee: "ar-associations-source-reflection"
blocked-by: null
---

## Context

Through-association and join-dependency classes miss reflection accessors:

- `associations/through-association.ts` (10/11),
  `associations/has-many-through-association.ts` (31/32),
  `associations/has-one-through-association.ts` (12/13): `source_reflection` —
  the reflection resolving the `:source` of a `has_*_through`
  (`vendor/rails/activerecord/lib/active_record/associations/through_association.rb`).
- `associations/association.ts` (50/51): `association_scope`.
- `associations/join-dependency/join-part.ts` (10/13): `column_names`,
  `primary_key`, `attribute_types`.

`source_reflection`/`association_scope` are readers trails computes inline;
join-part's `column_names`/`primary_key`/`attribute_types` forward to the base
klass. (Note RFC 0040 covers through-association _source convergence_ behavior;
this story is only the missing accessor names, not the convergence — coordinate
to avoid overlap.)

## Acceptance criteria

- `source_reflection` exposed on the through-association hosts;
  `association_scope` on Association; `column_names`/`primary_key`/
  `attribute_types` on JoinPart — ported (forwarding to existing state) or
  skip-listed with reason.
- No overlap with RFC 0040 files; if a name requires the 0040 convergence
  first, note the dependency.
- `pnpm api:compare --package activerecord` shows through-association.ts,
  has-many-through-association.ts, has-one-through-association.ts,
  association.ts, join-dependency/join-part.ts at 100%.
