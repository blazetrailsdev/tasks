---
title: "activerecord: save, destroy and the row writers resume through superMethod, not base.ts's closure list"
status: draft
updated: 2026-10-09
rfc: "0180-activerecord-receipt-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8710 included the `Persistence` module into `Base` at Rails' position
(`vendor/rails/v8.0.2/activerecord/lib/active_record/base.rb:300`) and defined on it `touch`, `save`, `saveBang`,
`destroy`, `createOrUpdate`, `_createRecord`, `_updateRecord`, `_touchRow`, `destroyRow`, `_queryConstraintsHash` and
`_updateRow` (`packages/activerecord/src/persistence.ts`, `export const Persistence = new Module(...)`).

Only `touch` resumes through the module: `TouchLater` -> `Transactions` -> `Callbacks` -> `Persistence` by
`superMethod`. For the other names `packages/activerecord/src/base.ts` still installs an own property on
`Base.prototype` from a closure list (the `for (const [name, fn] of [...])` block near the end of the file) that
nests each layer by hand through a continuation parameter, for example
`_Suppressor.save.call(this, () => _Transactions.save.call(this, () => _Validations.save.call(this, options, () => _Persistence.save.call(this, options, block))))`.
Those own properties shadow the module's entries, so the module definitions are not on the dispatch path.

Rails has no such list. Each module defines the method and calls `super`:
`suppressor.rb` `save`, `transactions.rb:361-375` `save` / `save!` / `destroy` / `touch`, `validations.rb:47-56`,
`timestamp.rb:107-130` `_create_record` / `_update_record` / `create_or_update`, `callbacks.rb:419-445`,
`attribute_methods/dirty.rb` `_touch_row` / `_update_record` / `_create_record`,
`locking/optimistic.rb:71-140` `_touch_row` / `_update_row` / `destroy_row` / `_query_constraints_hash`,
`counter_cache.rb` `destroy_row` / `_create_record`, ending in `persistence.rb`.

## Converged shape

Each layer's method is defined on its own `Module` and resumes with `Mod.superMethod(this, name)!(...)`, as
`touch` does in `transactions.ts`, `callbacks.ts` and `touch-later.ts`. The closure list in `base.ts` is deleted and
`Base` gets the methods from its `include` calls in Rails' order.

## Acceptance criteria

- [ ] `base.ts` has no hand-nested chain for `save`, `saveBang`, `createOrUpdate`, `_createRecord`, `destroy`,
      `_touchRow`, `destroyRow`, `_queryConstraintsHash`, `_updateRow` or `_updateRecord`.
- [ ] No layer function takes a continuation parameter Rails' method does not have.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green with no new row; `persistence.test.ts`,
      `callbacks.test.ts`, `transactions.test.ts`, `locking.test.ts`, `dirty.test.ts`, `counter-cache.test.ts`,
      `timestamp.test.ts` and `touch-later.test.ts` stay green.
- [ ] `save` on a record with no callbacks is not measurably slower (benchmark outside vitest).
