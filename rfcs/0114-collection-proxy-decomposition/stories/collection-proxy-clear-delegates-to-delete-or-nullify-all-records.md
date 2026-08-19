---
title: "clear/delete_all: delegate to the association instead of reimplementing delete_or_nullify_all_records"
status: done
updated: 2026-08-19
rfc: "0114-collection-proxy-decomposition"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 260
priority: null
pr: 6743
claim: "2026-08-19T14:30:05Z"
assignee: "collection-proxy-clear-delegates-to-delete-or-nullify-all-records"
blocked-by: null
closed-reason: null
---

## Context

Rails' `CollectionProxy#clear` is four lines:

```ruby
def clear          # collection_proxy.rb:1066-1069
  delete_all
  self
end
```

and `delete_all` is `@association.delete_all(dependent).tap { reset_scope }`
(`collection_proxy.rb:474-476`). Everything else — the `null_scope?`
short-circuit, the `:dependent` collapse, `delete_or_nullify_all_records`, the
counter update, the target reset — lives once on `CollectionAssociation`
(`vendor/rails/activerecord/lib/active_record/associations/collection_association.rb:150-184`).

`packages/activerecord/src/associations/collection-proxy.ts:1627-1710` instead
re-implements all of it inline: **38 code lines** covering the `isNullScope()`
early return, a separate `_isThrough` arm that reaches into the association for
`loadTarget`/`deleteRecords`, the `dep === "destroy" | "delete" | "delete_all" |
"deleteAll"` collapse, and the `scope().deleteAll()` / `scope().updateAll(...)`
split. Its private half is another **58 lines**:

- `_buildNullifyUpdates` (`:1578`, 22) — this is
  `computeNullifiedOwnerAttributes`, which already exists at
  `collection-association.ts:1228` (Rails `collection_association.rb:1228`
  equivalent `nullified_owner_attributes`).
- `_decrementCounterCache` (`:1554`, 18)
- `_removeFromTarget` (`:1530`, 18)

`collection-association.ts` already carries the destinations: `deleteAll`
(`:564`), `deleteOrNullifyAllRecords` (`:608`), `deleteRecords` (`:1217`),
`computeNullifiedOwnerAttributes` (`:1228`), `nullifyAllRecords` (`:1240`),
`deleteAllRecords` (`:1302`). The proxy's `delete()` (`:1522`) and `size()`
(`:1190`) already delegate correctly and prove the seam.

## Converged shape

`clear()` becomes Rails' body: `await this.deleteAll(); return this`.
`deleteAll()` stays the `@association.delete_all(dependent).tap { reset_scope }`
delegation it already is. Any behaviour the inline body carried that the
association lacks moves **into** `collection-association.ts` (or
`has-many-association.ts` / `has-many-through-association.ts` for the arm that
owns it), at the Rails name, not into a new proxy helper.

`_buildNullifyUpdates`, `_decrementCounterCache` and `_removeFromTarget` are
deleted; their callers use the association's methods.

## Acceptance criteria

- `clear()` in `collection-proxy.ts` is Rails' two-statement body.
- `_buildNullifyUpdates`, `_decrementCounterCache`, `_removeFromTarget` no
  longer exist in `collection-proxy.ts`.
- No new private helper is added to `collection-proxy.ts`.
- `pnpm parity:api:calls` / `:args` add zero rows for
  `activerecord/associations/collection-proxy.json` (no shard exists today and
  none may be created).
- Existing suites pass unchanged, incl.
  `has-many-associations.test.ts`, `has-many-through-associations.test.ts`,
  `collection-proxy.test.ts`, `assoc-has-many-counter-cache-clear` coverage.
  No test renamed.
