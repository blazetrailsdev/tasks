---
title: "Nested attributes: singular (belongsTo/hasOne) assignment populates/reuses the in-memory target synchronously (Rails one-to-one existing_record reuse)"
status: ready
updated: 2026-06-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Carved out of `nested-attributes-sync-existing-record-updates` (RFC
0023-surfaced-deviations), which was too large for a single PR (full Phase G
merge-on-load exceeds the 300 LOC ceiling and touches the core association
loader). This sub-story covers the **singular (belongsTo / hasOne)** slice.

Rails' `assign_nested_attributes_for_one_to_one_association`
(`nested_attributes.rb`) reads `existing_record = send(association_name)`
synchronously and, when reusing an already-built unsaved target, assigns into
it in memory and re-anchors via `Association#initialize_attributes`. trails'
synchronous setter cannot perform a DB read, but the **already-in-memory /
just-built** target case is fully synchronous and convergeable.

Current state: `assignNestedAttributesForOneToOneAssociation`
(`packages/activerecord/src/nested-attributes.ts`) already reuses an in-memory
new target (lines ~530-535), but the corresponding Rails behaviours are not yet
verified — the tests are `it.skip` stubs.

## Acceptance criteria

- Un-skip and implement (Rails-verbatim test names — read the Rails test first):
  - "reuse already built new record"
  - "do not allow assigning foreign key when reusing existing new record"
  - "first and array index zero methods return the same value when nested
    attributes are set to update existing record"
- Singular nested-attribute assignment populates / reuses the in-memory target
  synchronously so it is readable immediately after assignment.
- No regression to the existing deferred-flush path for DB-backed existing
  records (still covered by the unloaded follow-up stories).
- 300 LOC ceiling. Single PR from main. Test names match Rails verbatim.
