---
title: "activemodel: methods that thread super_ as a first parameter take Rails' parameter list"
status: done
updated: 2026-10-02
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: trails#8408
claim: "2026-10-02T16:02:00Z"
assignee: "autorun-seats-every-task-error-as-unexpected-error"
blocked-by: null
closed-reason: null
---

## Context

trails#8368 converged `ActiveModel::Dirty#init_attributes` from the object-literal `prepend` shape
`initAttributes(super_, other)` onto Rails' `init_attributes(other)`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/dirty.rb:253`), reaching the next implementation with a
`Module` link and `superMethod`. The same `super_`-first shape is still on every other ActiveModel
method whose Rails body calls `super`, so each carries one parameter Rails does not declare:

- `packages/activemodel/src/dirty.ts` — `initializeDup(super_, other)` (`dirty.rb:248`),
  `asJson(super_, options)` (`dirty.rb:264`), `initInternals(super_)` (`dirty.rb:371`).
- `packages/activemodel/src/validations.ts:353,373` — `initializeDup(super_, other)` and
  `initInternals(super_)` (`validations.rb:310`, `validations.rb:467`).
- `packages/activemodel/src/attributes.ts:31,39,126` — `initInternals(super_)`,
  `initializeDup(super_, other)`, `freeze(super_)` (`attributes.rb`).
- `packages/activemodel/src/attribute-methods.ts:662` — `initInternals(super_)`.
- `packages/activemodel/src/validations/callbacks.ts:99` — `runValidationsBang(super_)`
  (`validations/callbacks.rb`, `def run_validations!`).

`pnpm parity:api` reported only `init_attributes` as an arity mismatch (activemodel was 454/455), so
the arity comparison is not seeing these pairs. Find out why before converging them — a pair the
comparer skips is a pair the gate cannot hold.

The converged shape is the one `init_attributes` now has: the method takes Rails' parameter list and
calls `<Module>.superMethod(this, "<name>")!(...)`, with the module's link included in Rails'
ancestry order. `converge-model-init-internals-and-initialize-dup-super-chain` and
`converge-activerecord-init-internals-and-initialize-dup-super-chain` built the current chain on
`prepend()`'s `super_`; ActiveRecord's includers of these methods move with it.

## Acceptance criteria

- [ ] Each method above takes Rails' parameter list and reaches the next implementation through `superMethod`, not a threaded `super_`.
- [ ] The arity comparison covers these pairs, and `pnpm parity:api` activemodel arity stays 100% with them counted.
- [ ] `packages/activemodel/src/dirty.test.ts`, `validations.test.ts`, `attributes.test.ts` and the ActiveRecord `dup.test.ts` / `dirty.test.ts` suites stay green.

## Verification

```bash
pnpm build && pnpm parity:api && pnpm parity:api:calls && pnpm parity:api:calls:args
```
