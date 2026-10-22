---
title: "hot_compatibility prepared-statement tests drop assert_predicate :any? and Rails messages"
status: draft
updated: 2026-09-25
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8080, which converged `getPreparedStatementCache` to return the per-pid cache Hash (`vendor/rails/activerecord/test/cases/hot_compatibility_test.rb:118-121`).

The two prepared-statement tests (`hot_compatibility_test.rb:60-113`) still diverge in their assertions:

- Rails: `assert_predicate get_prepared_statement_cache(...), :any?, "expected prepared statement cache to have something in it"`. trails (`packages/activerecord/src/hot-compatibility.test.ts:96,126`): `expect(Object.keys(getPreparedStatementCache(adapter)).length > 0).toBeTruthy()`, with no message.
- Rails: `assert_empty ..., "expected prepared statement cache to be empty but it wasn't"`. trails (`:106,140`): `assertEmpty(...)` with no message.

## Converged shape

By CONTRIBUTING.md § "Porting a Minitest assertion" (trails#9176), both are
`expect` forms, never helpers: `assert_predicate o, :any?` is the `expect(o.isAny()).toBe(true)`
row, spelled over the cache's own `any?` (ruby-compat's Enumerable / Hash
`any?` port) rather than an `Object.keys(...).length` test, and `assert_empty`
is the row for the cache's receiver type. Each passes Rails' message as
`expect(x, msg)`.

## Acceptance criteria

- [ ] Both tests use those `expect` forms with Rails' two messages, and
      `hot-compatibility.test.ts` no longer imports `assertEmpty`.
- [ ] `parity:test:assertions` shows no kind or message mismatch left in `hot_compatibility_test.rb`.
