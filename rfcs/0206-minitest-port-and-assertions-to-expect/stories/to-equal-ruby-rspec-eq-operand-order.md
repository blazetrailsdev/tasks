---
title: "toEqualRuby: RSpec eq dispatches actual == expected"
status: draft
updated: 2026-11-06
rfc: "0206-minitest-port-and-assertions-to-expect"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`toEqualRuby` in `packages/vitest-matchers/src/index.ts:59-61` calls `rbEqual(exp, act)`, i.e. `expected == actual`. Minitest's `assert_equal exp, act` is `exp == act` (minitest/assertions.rb `assert_equal`: `assert exp == act`), but RSpec's `eq` matcher is `actual == expected` (rspec-expectations `BuiltIn::Eq#match`: `actual == expected`). For a receiver whose `==` is not symmetric, e.g. mail's `Field#==` (mail/lib/mail/field.rb), `expect(field).not.toEqualRuby(null)` (packages/mail/src/field.test.ts, "should say it is not == to nil", field_spec.rb:195-197) evaluates `nil == field` and never reaches `Field#==`.

## Acceptance criteria

- Ports of RSpec `eq` dispatch `actual == expected` (`rbEqual(act, exp)`), and ports of Minitest `assert_equal` keep `exp == act`. Either add an RSpec-shaped matcher or flip the argument order where every caller is an RSpec port.
- mail's "should say it is not == to nil" reaches `Field#equals`.
