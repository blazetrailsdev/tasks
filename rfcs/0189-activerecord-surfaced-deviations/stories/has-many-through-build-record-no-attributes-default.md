---
title: "activerecord: HasManyThroughAssociation#buildRecord drops the invented attributes default"
status: draft
updated: 2026-10-21
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`HasManyThroughAssociation#buildRecord` (`packages/activerecord/src/associations/has-many-through-association.ts`) runs `attributes ??= {}` before the inlined `ThroughAssociation#build_record` body (`activerecord/lib/active_record/associations/through_association.rb:116-129`) and before `super`.

Rails has no such default. `CollectionAssociation#build(attributes = nil)` (`collection_association.rb:117-123`) passes `nil` through to `build_record(attributes)`, and `ThroughAssociation#build_record` writes `attributes[foreign_key_column]` only when the source reflection is a collection with an inverse and a non-array target.

## Acceptance criteria

- `buildRecord` passes `attributes` through unchanged, as Rails does. Any default lives where Rails puts it (`Association#build_record` → `reflection.build_association(attributes)`).
- The has-many-through suite stays green.

## Audit 2026-10-22

`attributes ??= {}` is at `has-many-through-association.ts:155`.
