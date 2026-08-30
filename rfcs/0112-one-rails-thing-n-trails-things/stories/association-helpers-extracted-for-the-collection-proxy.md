---
title: "association-helpers-extracted-for-the-collection-proxy"
status: claimed
updated: 2026-08-29
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-29T23:33:49Z"
assignee: "association-helpers-extracted-for-the-collection-proxy"
blocked-by: null
closed-reason: null
---

## Context

A cluster of `@noRailsEquivalent` helpers in `packages/activerecord/src/associations/**`
exists because the port's `CollectionProxy` has no `Association` instance to call
Rails' methods on, so bodies Rails keeps on `Association` / `HasManyAssociation` /
`ThroughAssociation` were extracted as free functions:

- `alias-tracker.ts` — two spellings of the `arel_table.alias(...)` inline in
  `TableMetadata#associated_table` (table_metadata.rb:43)
- `belongs-to-association.ts` — the composite-PK branch of
  `BelongsToReflection#association_primary_key` (reflection.rb:926-938)
- `collection-association.ts` — the accumulation body of `#concat_records`
  (collection_association.rb:438-454)
- `collection-proxy.ts` — non-loading `target` read, the `find_by_scan` index
  (collection_association.rb:521), `owner` / `owner=` / `reflection` /
  `reflection.name` mirrors (association.rb:36-37), and the
  `add_to_target(record, skip_callbacks: true)` of nested_attributes.rb:534
- `foreign-association.ts` — `foreign_key` and `foreign_key_present?`
  (foreign_association.rb:5)
- `has-many-association.ts` — `#difference` / `#intersection`
  (has_many_association.rb:158,162) and `Association#scope` (association.rb:107)
  taken as an owner/name/options triple
- `has-many-through-association.ts` — the inverse half of `#build_record`
  (has_many_through_association.rb:90-109), `#difference`, `#intersection`
- `join-dependency/join-part.ts` — stored forms of `JoinPart#table`
  (join_part.rb:44) and `JoinAssociation#reflection` (join_association.rb:10)
- `through-association.ts` — the pre-super seeding half of `#build_record`
  (through_association.rb:116-129)

These are unfinished-port shapes, not TypeScript shortcomings: Rails reaches
each body off a real `Association` object.

## Acceptance criteria

- The proxy path reaches the Rails bodies on the association object rather than
  through extracted free functions, and each `@noRailsEquivalent CONVERGEABLE
association-helpers-extracted-for-the-collection-proxy` receipt is deleted with
  the helper it names.
- Split across as many PRs as the LOC ceiling needs; one file per PR is a
  natural cut.
- `pnpm parity:api:extra --package activerecord` novel count strictly drops.
