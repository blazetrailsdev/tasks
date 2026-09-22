---
title: "callbacks.test.ts: converge Rails-named tests off bare stand-in targets onto Rails fixtures"
status: done
updated: 2026-09-22
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#7982
claim: "2026-09-22T19:49:27Z"
assignee: "callbacks-test-rails-named-tests-use-stand-in-targets"
blocked-by: null
closed-reason: null
---

## Context

After trails#7980, `packages/activesupport/src/callbacks.test.ts` holds only
Rails-named tests. But 18 of them still build a bare `{ ... }` target with
`defineCallbacks(target, "save")` / `setCallback(target, ...)` instead of the
Rails fixture class or `build_class` helper the Rails test uses
(`vendor/rails/activesupport/test/callbacks_test.rb`):

- `AroundCallbacksTest#test_save_around` → Rails uses `AroundPerson` (`:266-315`, test `:408-424`); the TS file already defines `AroundPerson`.
- `OneTimeCompileTest#test_optimized_first_compile` → `OneTimeCompile < Record` (`:123-154`, test `:156-165`).
- `HyphenatedKeyTest#test_save` → `HyphenatedCallbacks` (`:342-382`, test `:900-906`).
- `RunSpecificCallbackTest` (3 tests) → `AllSaveCallbacks` (`:1216-1260`, tests `:1262-1290`).
- `NotPermittedStringCallbackTest` → `Class.new(Record)` (`:1206-1214`).
- `CallbackProcTest` `proc arity 0` / `proc arity 1` / `proc negative called with empty list` → `build_class(->…)` with `calls` array and `assert_equal [:foo]` / `[instance]` / `[[]]` (`:956-994`); the TS `buildClass` helper exists but only `proc arity 2` uses it.
- `CallbackTypeTest` (add/skip class, lambda, symbol, undefined, without raise) → its `build_class(callback, n = 10)` (`:1109-1192`); the TS `buildClass` exists in that describe but several tests bypass it.
- The stand-in in `ExcludingDuplicatesCallbackTest` region at TS `:892` (verify which Rails test it serves: `DuplicatingCallbacks` / `DuplicatingCallbacksInSameCall` `:808-816`).

## Acceptance criteria

- Each listed test runs on the Rails fixture or `build_class` helper named above, with Rails' assertions (e.g. `calls` equality, not a `ran` boolean).
- No test renamed; `parity:test` for `callbacks_test.rb` stays at 51 matched + 3 skipped, 0 extra; `parity:test:assertions` green.
