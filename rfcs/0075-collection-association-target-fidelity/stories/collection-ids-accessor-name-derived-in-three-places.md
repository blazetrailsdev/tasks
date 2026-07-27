---
title: "Derive the #{singular}Ids accessor name in one place"
status: ready
updated: 2026-07-27
rfc: "0075-collection-association-target-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The generated `#{singular}Ids` accessor name is derived independently in three
places, all spelling `${singularize(name)}Ids` by hand:

- `packages/activerecord/src/associations/builder/collection-association.ts:135`
  (`defineReaders`)
- `packages/activerecord/src/associations/builder/collection-association.ts:165`
  (`defineWriters`)
- `packages/activerecord/src/base.ts` `_isCollectionIdsWriter` (added by #5296)

Rails has one source: `ids_reader`/`ids_writer` are defined off
`reflection.name` inside `Builder::CollectionAssociation.define_readers`/
`define_writers`
(`vendor/rails/activerecord/lib/active_record/associations/builder/collection_association.rb:70-90`),
so no consumer re-derives the name.

The base.ts copy is the load-bearing one: `_isCollectionIdsWriter` decides
whether a constructor-form `postIds` key is deferred past `super()`. If the
builder's naming convention ever changes and this copy is not updated in
lockstep, the deferral silently stops matching and `new Author({postIds: [...]})`
regresses to `TypeError: Cannot read properties of undefined (reading 'get')` —
the exact bug #5296 fixed. Nothing fails loudly in between.

## Acceptance criteria

- [ ] The `#{singular}Ids` name is derived in exactly one place and consumed by
      `defineReaders`, `defineWriters`, and `_isCollectionIdsWriter`.
- [ ] No import cycle is introduced (`base.ts` does not currently import
      `associations/builder/collection-association.ts`); if a shared home is
      needed, place it where `api:compare` still maps the builder methods to
      their Rails-layout file.
- [ ] Existing constructor-form ids= coverage in
      `associations/collection-persisted-setter-throws.trails.test.ts` still
      passes unchanged.
- [ ] No test renames.
