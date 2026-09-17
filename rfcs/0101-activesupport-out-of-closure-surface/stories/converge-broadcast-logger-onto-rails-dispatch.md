---
title: "Converge BroadcastLogger onto Rails' method_missing dispatch and dup"
status: draft
updated: 2026-09-17
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::BroadcastLogger` (`vendor/rails/activesupport/lib/active_support/broadcast_logger.rb`)
is a plain object that holds `broadcasts` and dispatches by `method_missing` /
`respond_to_missing?` (`:230-259`). trails' `packages/activesupport/src/broadcast-logger.ts`
diverges in four ways, surfaced while converging
`broadcast_logger_test.rb` under RFC 0132:

- It extends `Logger`. Rails' class has no superclass, and the test's
  `CustomLogger` (a non-`Logger` object) is broadcast to directly.
- It has no `method_missing` dispatch, so `logger.foo`, `logger.bar { }`,
  `logger.baz("x")` and `logger.qux(param: "x")` (`broadcast_logger_test.rb:239-278`)
  have no counterpart, and a name no logger implements does not raise
  `NoMethodError`.
- Its predicates are string-keyed getters (`get "debug?"`), against the repo's
  `isX` spelling rule.
- It has no `dup` / `initialize_copy` (`broadcast_logger.rb:240-244`), which
  `#dup duplicates the broadcasts` (`broadcast_logger_test.rb:280-290`) asserts.

## Converged shape

`BroadcastLogger` stops extending `Logger`, keeps `broadcasts`, `broadcast_to`,
`stop_broadcasting_to`, the level/progname/formatter readers and writers, and
dispatches everything else the way Rails does, within CLAUDE.md
§ "Records are not Proxies" for the method_missing half.

## Acceptance criteria

- `broadcast_logger_test.rb` reports 0 assertion count/kind/value mismatches.
- The `"debug?"`-style getters are gone.
