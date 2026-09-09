---
title: "normalizeFindArgs invents a composite-arity RecordNotFound and renders the key via String()"
status: ready
updated: 2026-09-09
rfc: "0111-error-class-message-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: 32
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`normalizeFindArgs` (`packages/activerecord/src/relation/finder-methods.ts:70-88`)
raises two `RecordNotFound`s that Rails has no counterpart for, and both render
the primary key with `String(pk)` — the exact JS-coercion bug PR #7613 fixed one
method away in `raiseRecordNotFoundExceptionBang`.

```ts
if (ids.length === 0) {
  throw new RecordNotFound(`Couldn't find ${modelName} without an ID`, modelName, String(pk));
}
// ...
throw new RecordNotFound(
  `${modelName}: composite primary key requires a ${pkArity}-element array, got ${String(id)}`,
  modelName,
  String(pk),
  id,
);
```

Two separate problems:

1. **`String(pk)` on a composite key renders `shop_id,id`** where Ruby's
   `Array#to_s` renders `["shop_id", "id"]`. Verified against MRI:
   `ruby -e 'p "#{["shop_id","id"]}"'` => `"[\"shop_id\", \"id\"]"`.
   `finder-methods.trails.test.ts:220` currently pins the wrong value
   (`expect(err.primaryKey).toBe("shop_id,id")`), so it is the assertion to
   update. PR #7613 fixed the same class of bug for
   `raise_record_not_found_exception!`'s `key` and `ids`
   (`finder_methods.rb:427,430`) and left this site out of scope.

2. **The composite-arity message is a trails invention.** Rails' `find`
   (`vendor/rails/activerecord/lib/active_record/relation/finder_methods.rb:456-476`)
   has no arity pre-check: a composite-PK `find(1)` reaches `find_one`
   (`:528-537`), where `where(primary_key.zip(id).to_h)` simply produces no
   match and the ordinary `raise_record_not_found_exception!(id, 0, 1)` fires.
   There is no `"composite primary key requires a N-element array"` string
   anywhere in Rails.

Note the "without an ID" arm at `:71` DOES have a Rails counterpart, but not
here — Rails raises it in `CollectionAssociation#find`
(`associations/collection_association.rb:100-101`), which passes `args`, not a
stringified pk.

## Converged shape

Render the key the way Ruby's `Array#to_s` does — `rubyInspectArray`
(`packages/activerecord/src/relation/ruby-inspect.ts`) is already used for
exactly this in `raiseRecordNotFoundExceptionBang` — and drop the invented
composite-arity pre-check so a composite-PK miss raises Rails' ordinary
`RecordNotFound` from `find_one`. Update
`finder-methods.trails.test.ts:211-222`'s assertions to the Rails rendering
rather than the current TS strings.

## Acceptance criteria

- [ ] No `String(pk)` in `normalizeFindArgs`; a composite key renders as
      `["shop_id", "id"]`, verified against MRI.
- [ ] The `"composite primary key requires a N-element array"` message is gone,
      or a Rails `file:line` is cited for it.
- [ ] A composite-PK `find(1)` raises the same error Rails' `find_one` raises.
- [ ] Composite-primary-key finder suites green on all three adapters, with no
      test names changed.
