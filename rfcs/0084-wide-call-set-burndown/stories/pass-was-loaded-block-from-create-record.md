---
title: "Pass the @_was_loaded block from CollectionAssociation#_createRecord to insertRecord"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6418
claim: "2026-08-12T15:36:57Z"
assignee: "call-args-ar-connection-adapters-blocks"
blocked-by: null
closed-reason: null
---

## Context

`CollectionAssociation#_create_record`
(`vendor/rails/activerecord/lib/active_record/associations/collection_association.rb:354-372`)
passes a block to `insert_record`:

```ruby
add_to_target(record) do
  result = insert_record(record, true, raise) {
    @_was_loaded = loaded?
  }
end
```

That block reaches Rails' post-INSERT / pre-`after_create` yield point
(persistence.rb:891-940) and captures `@_was_loaded` before an `after_create`
callback can load the association, which is what makes `replace_on_target`'s
`elsif @_was_loaded || !loaded?` (collection_association.rb:480) skip an append
the callbacks already made.

trails' `_createRecord`
(`packages/activerecord/src/associations/collection-association.ts`, ported in
PR #6410) omits it and carries a `@missingRailsCall loaded?` tag instead. The
omission was correct when written — nothing read the flag. It no longer is:
`plumb-save-block-through-create-record` (#6405) gave `insertRecord` its
trailing block, `_wasLoaded` is now a real field
(collection-association.ts:150), `replaceOnTarget` reads it
(collection-association.ts:1474), and the sibling `concatRecords` already
passes the block (collection-association.ts:541).

So `_createRecord` is now the one caller left that does not.

## Converged shape

In `_createRecord`, pass the same block `concatRecords` passes:

```ts
result = await this.insertRecord(record, true, shouldRaise, () => {
  this._wasLoaded = this.isLoaded();
});
```

and delete the `@missingRailsCall loaded?` tag from the method's JSDoc.

## Acceptance criteria

- [ ] `_createRecord` passes the `@_was_loaded = loaded?` block to
      `insertRecord`, matching collection_association.rb:365-367.
- [ ] The `@missingRailsCall loaded?` tag on `_createRecord` is deleted (the
      call-set gate should credit the call once it is made).
- [ ] Regression coverage on the create path mirroring the concat-path one in
      `collection-association-reset-concat-empty.trails.test.ts`: an
      `after_create` callback that loads the collection must not leave a
      duplicated target entry after `association.create` / proxy `create`.
- [ ] `pnpm parity:api:calls` stays green with one fewer omission, not a new
      baseline row.
