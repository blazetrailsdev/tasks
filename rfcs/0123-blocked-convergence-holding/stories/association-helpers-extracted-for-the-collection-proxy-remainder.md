---
title: "association-helpers-extracted-for-the-collection-proxy-remainder"
status: draft
updated: 2026-09-06
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`association-helpers-extracted-for-the-collection-proxy` converged its first
slice in trails#7574: `foreignKeyPresentFor` became `foreignKeyPresent`, the
`this`-typed mirror of `ForeignAssociation#foreign_key_present?`
(`vendor/rails/activerecord/lib/active_record/associations/foreign_association.rb:5-11`),
mixed onto `HasManyAssociation.prototype` and `HasOneAssociation.prototype` the
way Rails writes `include ForeignAssociation`
(`has_many_association.rb:12`, `has_one_association.rb:7`).

The rest of that cluster is still extracted free functions, each carrying a
`@noRailsEquivalent CONVERGEABLE association-helpers-extracted-for-the-collection-proxy`
receipt. They exist because the port's `CollectionProxy` has no `Association`
instance to call Rails' methods on:

- `alias-tracker.ts` — two spellings of the `arel_table.alias(...)` inline in
  `TableMetadata#associated_table` (`table_metadata.rb:43`)
- `belongs-to-association.ts` — the composite-PK branch of
  `BelongsToReflection#association_primary_key` (`reflection.rb:926-938`)
- `collection-association.ts` — the accumulation body of `#concat_records`
  (`collection_association.rb:438-454`)
- `collection-proxy.ts` — non-loading `target` read, the `find_by_scan` index
  (`collection_association.rb:521`), `owner` / `owner=` / `reflection` /
  `reflection.name` mirrors (`association.rb:36-37`), and the
  `add_to_target(record, skip_callbacks: true)` of `nested_attributes.rb:534`
- `foreign-association.ts` — `ownerForeignKeyColumns`, the extracted
  `reflection.foreign_key` read, and `ForeignAssociation.nullifiedOwnerAttributes`,
  which Rails writes as the instance method `#nullified_owner_attributes`
  (`foreign_association.rb:13-18`)
- `has-many-association.ts` — `#difference` / `#intersection`
  (`has_many_association.rb:158,162`) and `Association#scope`
  (`association.rb:107`) taken as an owner/name/options triple
- `has-many-through-association.ts` — the inverse half of `#build_record`
  (`has_many_through_association.rb:90-109`), `#difference`, `#intersection`
- `join-dependency/join-part.ts` — stored forms of `JoinPart#table`
  (`join_part.rb:44`) and `JoinAssociation#reflection` (`join_association.rb:10`)
- `through-association.ts` — the pre-super seeding half of `#build_record`
  (`through_association.rb:116-129`)

These are unfinished-port shapes, not TypeScript shortcomings: Rails reaches each
body off a real `Association` object.

## Acceptance criteria

- The proxy path reaches the Rails bodies on the association object rather than
  through extracted free functions, and each remaining
  `@noRailsEquivalent CONVERGEABLE association-helpers-extracted-for-the-collection-proxy`
  receipt is deleted with the helper it names.
- Split across as many PRs as the LOC ceiling needs; one file per PR is a
  natural cut.
- `pnpm parity:api:extra --package activerecord` novel count strictly drops.
