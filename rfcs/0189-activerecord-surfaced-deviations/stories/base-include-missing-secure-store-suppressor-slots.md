---
title: "base-include-missing-secure-store-suppressor-slots"
status: draft
updated: 2026-11-17
rfc: "0189-activerecord-surfaced-deviations"
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

`ActiveRecord::Base` includes `SecurePassword` (`vendor/rails/v8.0.2/activerecord/lib/active_record/base.rb:318`), `Store` (`:326`), `SecureToken` (`:327`) and `Suppressor` (`:330`). In `packages/activerecord/lib/base.ts` none of them has an `include(Base, …)` at its slot:

- `secure-password.ts`, `secure-token.ts` and `suppressor.ts` export functions and no module object.
- Store's instance members (`readStoreAttribute`, `writeStoreAttribute`, `storeAccessorFor`) are installed as a plain object at the `:326` slot. Only `_StoreClassMethods` is extended.
- The trailing `include(Base, { initWith, …, touchDeferredAttributes })` block in `base.ts` installs private helpers from many modules (Core, Persistence, Validations, Transactions, TouchLater, CounterCache, AttributeMethods) after `Marshalling::Methods` (`:332`). It sits outside the sequence trails#10220 established. None of its names collides with a module member today, so the order is not observable yet.

## Acceptance criteria

- Each of `SecurePassword`, `Store`, `SecureToken` and `Suppressor` is a module object included at its `base.rb` slot, or has its members installed there.
- The trailing private-helper block's entries are installed at their owning module's `base.rb` slot.
- `Base.prototype` resolves every name to the same function as before, or any change is the Rails-correct winner and has a test.
