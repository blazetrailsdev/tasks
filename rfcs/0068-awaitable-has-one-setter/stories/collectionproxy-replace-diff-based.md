---
title: "collectionproxy-replace-diff-based"
status: draft
updated: 2026-07-23
rfc: "0068-awaitable-has-one-setter"
cluster: null
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

`CollectionProxy#replace` in trails is implemented as `clear()` + `push()`
(`packages/activerecord/src/associations/collection-proxy.ts:3358`):

```ts
async replace(records: T[]): Promise<void> {
  this._ensureThroughWritable();
  await this.clear();
  await this.push(...records);
}
```

Rails' `CollectionProxy#replace` (collection_proxy.rb:391) forwards to
`CollectionAssociation#replace` → `replace_records`
(collection_association.rb:242, 418), which is **diff-based**:

```ruby
def replace_records(new_target, original_target)
  delete(difference(target, new_target))      # only records NOT in new set
  unless concat(difference(new_target, target))  # only records NOT already present
    @target = original_target
    raise RecordNotSaved, ...
  end
  target
end
```

Rails deletes only the _difference_ (records being removed) and concats only
the _newly added_ records; records present in both the old and new target are
left untouched (`replace_common_records_in_memory`,
collection_association.rb:429).

trails' `clear()`+`push()` instead removes **every** current record and then
re-adds the whole new array. For an association with `dependent: :destroy` this
is a behavioral divergence: a record that appears in both the old and new
target gets **destroyed** by `clear()` and cannot be re-added by `push()`.

Concrete failure this surfaced in: `HasManyAssociationsTest > replace with new`
(`packages/activerecord/src/associations/has-many-associations.test.ts:777`).
`Firm.clients` has `dependent: :destroy` (company.ts:184 / Rails company.rb:57).
`firm.clients.replace([second_client, Client.new(...)])` should keep
`second_client` (present before and after) and only remove `first_client` — but
`clear()`+`push()` destroys `second_client` too, yielding 1 client instead of 2.

That test was worked around in PR #5169 by routing through the awaitable,
diff-based `firm.association("clients").writer([...])` instead of the proxy's
`replace`. But the proxy method itself remains non-Rails-faithful, and the
`CollectionPersistedAssignmentError` message
(`collection-association.ts:106`) actively _directs users_ to
`await owner.clients.replace([...])` — i.e. to the buggy path.

The correct fix: `CollectionProxy#replace` should forward to the association's
diff-based `writer`/`replace` (`collection-association.ts:76` `writer`, `:513`
`replace` + `persistReplacePlan`), matching Rails' `@association.replace`, so
the common-record set is preserved and only the difference is deleted/added.

## Acceptance criteria

- `CollectionProxy#replace` (collection-proxy.ts:3358) forwards to the
  association-level diff-based replace (Rails `@association.replace` →
  `replace_records`), NOT `clear()` + `push()`.
- Records present in both the old and new target are left untouched (no
  destroy/delete for `dependent: :destroy`/`:delete_all` associations).
- Only the removed difference is deleted; only the added difference is concated.
- On save failure of a new record, `@target` is restored to `original_target`
  and `RecordNotSaved` is raised (collection_association.rb:422-424).
- `HasManyAssociationsTest > replace with new` passes when written against
  `firm.clients.replace([...])` (i.e. revert #5169's `.association(...).writer`
  workaround back to the proxy `.replace` the error message advertises).
- Existing `.replace([])` / clear-style callers (e.g.
  has-many-associations.test.ts:6536, 6627) still pass.
- Run on all three adapters (SQLite, PG, MariaDB).
