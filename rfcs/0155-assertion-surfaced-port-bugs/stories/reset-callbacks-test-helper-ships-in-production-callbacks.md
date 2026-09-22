---
title: "ActiveRecord::TestCase#reset_callbacks is ported into production callbacks.ts and the public barrel"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
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

Surfaced while landing `assertions-has-many-associations-remainder-11` (trails#7973), whose `prevent double firing the before save callback…` (rb:3024) and `loading association in validate callback…` (rb:3143) ports call `resetCallbacks(HmBulb, "save" | "validation", block)`.

Rails' block helper is a **test-case** method: `ActiveRecord::TestCase#reset_callbacks(klass, kind)` (`vendor/rails/activerecord/test/cases/test_case.rb:179-191`). It dups `klass.send("_#{kind}_callbacks")` for `klass` and each `klass.subclasses`, yields, and restores them through `_#{kind}_callbacks=` in `ensure`.

trails defines it as `export async function resetCallbacks(modelClass, event, fn)` in the **production** module `packages/activerecord/src/callbacks.ts:27` (the mirror of `activerecord/lib/active_record/callbacks.rb`, which has no such method) and re-exports it from the public barrel `packages/activerecord/src/index.ts:100`. So it ships as public ActiveRecord API with a name that collides with `ActiveSupport::Callbacks::ClassMethods#reset_callbacks(name)` (`activesupport/lib/active_support/callbacks.rb:811`, `packages/activesupport/src/callbacks.ts:1318`), a different 2-arg method that clears callbacks. A reviewer on #7973 mistook one for the other.

It also snapshots with `peekCallbackChain` / `getCallbackChains` and `chain.clear()` + `append` rather than reading/assigning the `_#{kind}_callbacks` class attribute the way Rails does.

## Converged shape

- Move `resetCallbacks(klass, kind, block)` beside the other `ActiveRecord::TestCase` ports in `packages/activerecord/src/testing/` (`sql-capture.ts` already hosts `capture_sql` from `test_case.rb:89-102`), with Rails' parameter names (`klass`, `kind`).
- Snapshot and restore through the `_${kind}Callbacks` class-attribute reader/writer, mirroring `test_case.rb:180-190`.
- Drop it from `callbacks.ts` and from the `index.ts` public barrel. Update the test importers (`grep -rn "resetCallbacks" packages/activerecord/src --include=*.test.ts`).

## Acceptance criteria

- `packages/activerecord/src/callbacks.ts` no longer defines `resetCallbacks`, and `index.ts` no longer exports it.
- The test-case helper lives in `packages/activerecord/src/testing/` and mirrors `test_case.rb:179-191`.
- All importing tests pass. `parity:api:extra:gate` and `parity:api:calls` stay green.
