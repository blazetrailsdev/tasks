---
title: "save-callback-halt-propagation-on-inner-abort"
status: ready
updated: 2026-06-26
rfc: "0019-canonical-schema-burndown"
cluster: null
deps:
  - persistence-test-canonical-wave15
  - validations-core
deps-rfc: []
est-loc: null
priority: 80
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`callbacks.test.ts` (RFC 0019 convergence of `callbacks_test.rb`) ports Rails'
`test_before_create_throwing_abort` and `test_before_update_throwing_abort`
faithfully. Both assert that when a `before_create` / `before_update` callback
throws `:abort`, the enclosing **save** callbacks do not run — Rails
`assert_save_callbacks_not_called` checks `after_save_called` is false.

trails diverges: in `base.ts` `_createOrUpdate`, the `save` callback chain
(`cbRunAll(proto, "save", ...)`) runs `_createRecord()` / `_updateRecord()`
inside its block. When the inner create/update chain halts it returns `false`,
but the block completes normally, so `cbRunAll("save")` is NOT halted and the
`after_save` callbacks still fire. Repro:

- trails: `packages/activerecord/src/base.ts:3180` (the `save` block sets
  `saved=false` on inner halt but never propagates the halt to the save chain).
- Rails: a `before_create`/`before_update` `throw :abort` halts the whole save,
  skipping `after_save`.

The two tests are currently `it.skip`-ped in `callbacks.test.ts` with a pointer
to this story (search `before create throwing abort` / `before update throwing
abort`). Everything else in the file converged to the canonical `developers`
table + fixtures.

## Acceptance criteria

- [ ] `before_create` / `before_update` throwing `:abort` halts the enclosing
      save chain so `after_save`/`after_create`/`after_update` do not run
      (likely: propagate the inner halt out of the `cbRunAll("save")` block,
      e.g. re-throw the abort sentinel when `_createRecord`/`_updateRecord`
      returns false).
- [ ] Un-skip `before create throwing abort` and `before update throwing abort`
      in `callbacks.test.ts`; both pass unchanged.
- [ ] No regression in `callbacks.test.ts`, `transaction-callbacks.test.ts`,
      `persistence.test.ts`, `validations.test.ts`.
