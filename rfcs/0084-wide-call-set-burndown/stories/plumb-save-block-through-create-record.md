---
title: "plumb-save-block-through-create-record"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6405
claim: "2026-08-12T10:06:02Z"
assignee: "plumb-save-block-through-create-record"
blocked-by: null
closed-reason: null
---

## Context

Rails' `CollectionAssociation#insert_record` takes `&block` and hands it to
`record.save(&block)` / `save!(&block)`
(`vendor/rails/activerecord/lib/active_record/associations/collection_association.rb:377-383`).
`Persistence#create_or_update` forwards it to `_create_record`, which yields it
**after the INSERT and before the after_create callbacks**
(`vendor/rails/activerecord/lib/active_record/persistence.rb:891-940`).

`concat_records` (collection*association.rb:445) and `_create_record`
(collection_association.rb:366) use that yield point to capture
`@_was_loaded = loaded?` \_before* after_create callbacks can load the
association, which is what makes `replace_on_target`'s
`elsif @_was_loaded || !loaded?` (collection_association.rb:480) skip an append
the callbacks already made.

trails' save stack takes no block. PR for
`converge-collection-association-reset-concat-empty` ported the block down to
`CollectionAssociation#insertRecord` /
`HasManyAssociation#insertRecord` / `HasManyThroughAssociation#insertRecord`
and invokes it immediately after the `save`, marked with `@missingRailsCall
save(&block)` at
`packages/activerecord/src/associations/collection-association.ts#insertRecord`.
That is the same moment for every path that does not load the association from
an after_create callback, and the wrong moment for the paths that do.

## Acceptance criteria

1. `save` / `saveBang` accept Rails' trailing block and thread it through
   `createOrUpdate` → `_createRecord` (base.ts, callbacks.ts, timestamp.ts,
   counter-cache.ts, attribute-methods.ts layers) to Rails' yield site: after
   the INSERT, after `@new_record = false`, before the after_create callbacks.
2. `CollectionAssociation#insertRecord` passes its block to `save`/`saveBang`
   instead of calling it itself; the `@missingRailsCall save(&block)` tag is
   deleted.
3. Regression coverage: an after_create callback that loads the collection does
   not produce a duplicated target entry (Rails' `@_was_loaded` guard).
