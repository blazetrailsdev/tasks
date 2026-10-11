---
title: "activerecord: query_constraints_list callers send the class method instead of .call on an imported function"
status: ready
updated: 2026-10-11
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8784 made `queryConstraintsList` a class method carried by `Persistence::ClassMethods` and declared on `Base` (`packages/activerecord/src/persistence.ts`, `base.ts`), as Rails defines it (`vendor/rails/v8.0.2/activerecord/lib/active_record/persistence.rb:223-229`), and converged `relation/finder-methods.ts` onto `this.model.queryConstraintsList()`.

The other callers still import the free function from `persistence.js` and invoke it with `.call(klass)`, where Rails sends `klass.query_constraints_list`:

- `packages/activerecord/src/autosave-association.ts` (`queryConstraintsList.call(record.constructor)`, two sites)
- `packages/activerecord/src/associations/has-one-association.ts` (two sites)
- `packages/activerecord/src/associations/has-many-association.ts` (two sites, `as any` on the receiver)
- `packages/activerecord/src/reflection.ts` (two sites, `as any` on the receiver)
- `packages/activerecord/src/persistence.ts` (three instance-method sites, `.call(this.constructor as any)`)

`grep -rn 'queryConstraintsList.call' packages/activerecord/src` lists them. `hasQueryConstraints` and `compositeQueryConstraintsList` (`persistence.rb:219-236`) are in the same state: free functions that are not members of `ClassMethods`.

## Converged shape

`has_query_constraints?`, `query_constraints_list` and `composite_query_constraints_list` are members of `Persistence::ClassMethods`, and every caller sends the method to the class (`klass.queryConstraintsList()`), with no `.call` and no `as any` on the receiver.

## Acceptance criteria

- [ ] No `queryConstraintsList.call(`, `hasQueryConstraints.call(` or `compositeQueryConstraintsList.call(` remains in `packages/activerecord/src`.
- [ ] The three are `ClassMethods` members declared on `Base`; importers that only needed the free function drop the `persistence.js` import.
- [ ] `pnpm parity:api:calls`, `:calls:args` and `:extra:gate` stay green; plain-node import of the built `dist/associations/has-one-association.js` and `dist/reflection.js` as entry modules still resolves.
