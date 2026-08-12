---
title: "was-loaded-duplicate-append-regression"
status: ready
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
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

Rails' `replace_on_target` skips an append its own callbacks already made:

```ruby
@_was_loaded = true
yield(record) if block_given?
...
elsif @_was_loaded || !loaded?
  @association_ids = nil
  target << record
```

(`vendor/rails/activerecord/lib/active_record/associations/collection_association.rb:468-489`)

`@_was_loaded` is captured by the block `concat_records` / `_create_record`
hand to `insert_record` (`collection_association.rb:366,445`), which
`insert_record` forwards into `record.save(&block)` (`:377-383`).
`Persistence#_create_record` yields it after the INSERT and **before** the
after_create callbacks (`persistence.rb:920-940`) — so a callback that loads
the association cannot make the capture read `true` after the fact.

That mechanism now exists in trails across two PRs:

- #6401 (`converge-collection-association-reset-concat-empty`) added
  `CollectionAssociation._wasLoaded`, the `concatRecords` capture block, and the
  `elsif @_was_loaded || !loaded?` arm in `replaceOnTarget` /
  `replaceOnTargetAsync`.
- #6405 (`plumb-save-block-through-create-record`) threaded the block through
  `save`/`saveBang` → `createOrUpdate` → `_createRecord`/`_updateRecord` to
  Rails' yield site, and made `insertRecord` hand its block to `save` instead of
  invoking it after the save returns.

Neither PR could write the end-to-end regression on its own: #6401 predates the
yield-site plumbing (its capture ran after the save, so an after_create callback
that loads the collection still won the race), and #6405 must not duplicate the
`_wasLoaded` machinery from #6401. The two compose only once both are on `main`.

## Acceptance criteria

1. With both #6401 and #6405 merged, add regression coverage: an `after_create`
   callback on the child that loads the owner's collection must NOT leave a
   duplicated entry in the association target after `owner.things << thing` /
   `owner.things.create(...)` — the callback's own load already appended it, and
   `@_was_loaded` (captured before the callback ran) must make
   `replace_on_target` take the no-append arm.
2. The test fails if `insertRecord`'s block is moved back to after the `save`
   (i.e. it actually pins the yield-site ordering, not just the `_wasLoaded`
   field).
3. Prefer the canonical models/fixtures; if Rails covers this shape in
   `test/cases/associations/has_many_associations_test.rb`, port that test under
   its Rails name rather than writing a trails-only one.
