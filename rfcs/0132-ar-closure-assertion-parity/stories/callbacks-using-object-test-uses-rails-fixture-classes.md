---
title: "callbacks-using-object-test-uses-rails-fixture-classes"
status: closed
updated: 2026-09-22
rfc: "0132-ar-closure-assertion-parity"
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
closed-reason: "Sunset of 0132. trails#7982 converged callbacks_test.rb's assertions; UsingObjectTest still builds targets via local usingObjectBefore/customScopeObject closures (callbacks.test.ts:1002-1047) instead of Rails' CallbackObject/UsingObject* fixture classes (callbacks_test.rb:707-776), but that is body shape with no parity:test or assertion-counter row. No active RFC owns test-side body drift after 0132; re-file under a successor assertion RFC if one opens."
---

## Context

`UsingObjectTest` in `vendor/rails/activesupport/test/callbacks_test.rb:817-840`
runs on four fixture classes: `CallbackObject` (`:707-721`), `UsingObjectBefore`
(`:723-739`), `UsingObjectAround` (`:741-757`) and `CustomScopeObject`
(`:759-776`, `define_callbacks :save, scope: [:kind, :name]`). Each has its own
`save` wrapping `run_callbacks :save do @record << "yielded" end` (the custom-scope
one also returns `"CallbackResult"`).

`packages/activesupport/src/callbacks.test.ts` (`describe("UsingObjectTest")`)
instead builds bare `{ record: [] }` targets through local
`usingObjectBefore` / `usingObjectAround` / `customScopeObject` closures, with
a shared `save(u)` / `customScopeSave(u)` helper calling `runCallbacks` on them.
trails#7982 converged the rest of the file's stand-in targets; its reviewer
asked for this describe to go in a separate PR.

## Acceptance criteria

- Top-level `CallbackObject`, `UsingObjectBefore`, `UsingObjectAround` and
  `CustomScopeObject` classes mirroring `callbacks_test.rb:707-776` (each
  `defineCallbacks` + `setCallback` in a static block, a `record` field, a
  `save()` method), placed in Rails' fixture order.
- The four tests use `new UsingObjectBefore()` etc. and `u.save()`, with
  Rails' assertions (`:818-839`). The closure helpers are deleted.
- No test renamed; `parity:test` for `callbacks_test.rb` unchanged (51 matched +
  3 skipped, 0 extra).
