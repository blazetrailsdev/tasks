---
title: "replace_records must gate on concat's falsy return, not a caught Rollback"
status: ready
updated: 2026-07-27
rfc: "0075-collection-association-target-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `CollectionAssociation#replace_records`
(`vendor/rails/activerecord/lib/active_record/associations/collection_association.rb:418-428`)
gates on the **return value** of `concat`:

```ruby
unless concat(difference(new_target, target))
  @target = original_target
  raise RecordNotSaved, "Failed to replace #{reflection.name} because one or more of the " \
                        "new records could not be saved."
end
```

trails' `replaceRecords` (`packages/activerecord/src/associations/collection-association.ts:1356-1381`
on `origin/main` 2026-08-09 — still open) instead wraps `assoc.concat(...)` in a
`try/catch` and only raises `RecordNotSaved` when it catches a thrown `Rollback`.
Note the runtime `CollectionProxy#_replaceRecords` (`collection-proxy.ts:3236-3245`)
has ALREADY converged onto the falsy-return gate (`if (toAdd.length > 0 && (await
this.push(...toAdd)) === false)`); this story is the OO twin catching up, and that
body is the shape to copy.

That catch arm is effectively dead on the normal path. `CollectionAssociation#concat`
wraps the persisted-owner case in `transaction(...)`, and `Base.transaction`
(`transactions.ts:82-129`) **swallows** `Rollback` and resolves to `undefined` — so
nothing is thrown for the catch to see, and `RecordNotSaved` is never raised where
Rails raises it. The `@target = original_target` restore is skipped for the same reason.
The catch only fires in the no-`klass.transaction` fallback where `transaction()` calls
the block bare.

This was surfaced while landing #5279 (`CollectionProxy#push`/`#concat` returning false
on a failed insert). That PR changed `CollectionAssociation#concat` to return
`Base[] | undefined` — the nil Rails relies on — so the faithful fix is now a
one-line gate instead of exception plumbing.

## Acceptance criteria

- `replaceRecords` gates on the falsy `concat` return (`if (!(await assoc.concat(...)))`)
  rather than catching `Rollback`, matching `replace_records`' `unless concat(...)`.
- On that failure it restores `assoc.target = originalTarget` and raises `RecordNotSaved`,
  as Rails does — verified to actually fire on the transaction-backed path, not only in
  the no-transaction fallback.
- Non-`Rollback` errors (adapter/query failures) still propagate untouched.
- Regression test fails on baseline: replacing a collection where one new record fails
  validation must raise `RecordNotSaved` and leave the original target in place.
  Check `vendor/rails/activerecord/test/cases/associations/has_many_associations_test.rb`
  for the Rails test that covers this before writing a new one.
