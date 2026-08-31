---
title: "create-record-coerces-id-to-boolean-before-create-or-update"
status: draft
updated: 2026-08-31
rfc: "0113-branch-and-guard-parity"
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

Surfaced while converging `_update_record`'s return value in PR #7291, which
was scoped to the update arm only.

Rails' `_create_record` returns the new id, and `create_or_update` coerces
with `result != false` (`vendor/rails/activerecord/lib/active_record/persistence.rb:894`):

```ruby
def create_or_update(**, &block)
  _raise_readonly_record_error if readonly?
  return false if destroyed?
  result = new_record? ? _create_record(&block) : _update_record(&block)
  result != false
end
```

PR #7291 moved the update half of that coercion to `create_or_update`'s own
site (`packages/activerecord/src/base.ts#_createOrUpdate`), so
`callbacks.ts#_updateRecord` now returns `_run_update_callbacks`'s value
unchanged, mirroring `callbacks.rb:448-450`. The create half was left as it
was: `callbacks.ts#_createRecord` still coerces its chain to a boolean with
`!== false`, and `_createOrUpdate`'s create arm still reads that boolean
rather than applying `result != false` itself.

`Base#_createRecord` is declared `Promise<boolean>`
(`packages/activerecord/src/base.ts`), where Rails returns the id.

## Converged shape

Same three moves the update half took:

- `callbacks.ts#_createRecord` returns the `runCallbacks` value unchanged.
- `_createOrUpdate`'s create arm becomes `saved = result !== false`, so both
  arms read as Rails' single `result != false`.
- The `Base` interface declaration widens off `Promise<boolean>`.

Then walk the super chain — the Dirty, Timestamp, counter-cache and
`LockingOptimistic` layers — so nothing narrows the id to a boolean earlier
than Rails does.

## Acceptance criteria

- [ ] No intermediate layer in the create chain coerces to a boolean before
      `create_or_update` applies `result != false`.
- [ ] `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args` show no
      new row.
- [ ] AR suite green on all three lanes.
