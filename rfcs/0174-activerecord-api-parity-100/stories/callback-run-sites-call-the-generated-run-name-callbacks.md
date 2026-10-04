---
title: "activerecord/activemodel: callback run sites call the generated _run_<name>_callbacks"
status: draft
updated: 2026-10-04
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Since trails#8453 `define_callbacks` generates `_run<Name>Callbacks` on the prototype (`vendor/rails/v8.0.2/activesupport/lib/active_support/callbacks.rb:941-945`), but the activerecord and activemodel callers still spell `this.runCallbacks("<name>", …)` (receiver converged in trails#8461). Rails calls the generated method at each of these sites:

- `activerecord/lib/active_record/core.rb:481,516-517,553` — `_run_initialize_callbacks`, `_run_find_callbacks` (trails `base.ts` constructor, `core.ts` `initWithAttributes` / `initializeDup`).
- `activerecord/lib/active_record/transactions.rb:373,384,394` — `_run_before_commit_callbacks`, `_run_commit_callbacks`, `_run_rollback_callbacks` (trails `transactions.ts` `beforeCommittedBang` / `committedBang` / `rolledbackBang`, which also carry an unused `const ctor`).
- `activerecord/lib/active_record/callbacks.rb:423,432,436,441,445,449` — `_run_destroy_callbacks { super }`, `_run_touch_callbacks`, `_run_save_callbacks`, `_run_create_callbacks`, `_run_update_callbacks` (trails `callbacks.ts` and `base.ts` save/destroy).
- `activerecord/lib/active_record/associations/has_many_through_association.rb:152` — `scope.each(&:_run_destroy_callbacks)` (trails `has-many-through-association.ts`, a `for` loop over `r.runCallbacks("destroy")`).
- `activemodel/lib/active_model/validations.rb:474`, `validations/callbacks.rb:115` — `_run_validate_callbacks`, `_run_validation_callbacks { super }`.

The trails sites pass a third `{ strict: "sync" }` argument on the initialize/find chains, which the generated method does not forward.

## Acceptance criteria

- [ ] Each site above calls the generated `_run<Name>Callbacks(block)` as the Rails line does; no `runCallbacks("<literal>")` remains where Rails calls the generated method.
- [ ] The `strict: "sync"` behaviour of the initialize/find chains is preserved (decide how the generated method carries it, or show it is unneeded), with the tests that cover an async initialize callback still passing.
- [ ] The unused `const ctor` locals in `transactions.ts` are deleted.
