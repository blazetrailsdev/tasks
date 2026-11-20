---
title: "activesupport: retire tryCall (lib/try.ts), a second try port with no Rails counterpart"
status: draft
updated: 2026-11-20
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
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

trails#10412 converged `Tryable.try` / `Tryable.tryBang` in `packages/activesupport/lib/core-ext/object/try.ts` onto `try.rb:7-30` (`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/object/try.rb`): the block arm, then `respond_to?` and `public_send`. `packages/activesupport/lib/try.ts` still exports `tryCall`. It has no Rails counterpart and is a second `try` port, with its own arms (a raw property read, an `in` probe, and a `undefined` answer for nil where `NilClass#try` answers `nil`, `try.rb:148-154`). Its readers are `test/try.test.ts`, `test/core-ext/object/try.test.ts` (the ObjectTryTest cases mirroring `test/core_ext/object/try_test.rb`) and `test/core-ext/enumerable.trails.test.ts`, plus the `index.ts` export.

## Acceptance criteria

- [ ] Every `tryCall` caller uses `Tryable.try`. ObjectTryTest asserts `null` where `try_test.rb` uses `assert_nil`.
- [ ] `lib/try.ts` and its `index.ts` export are deleted, and `parity:api:extra --package activesupport` loses its two `try.ts` novel rows.
