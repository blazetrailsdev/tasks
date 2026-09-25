---
title: "hot_compatibility prepared-statement tests drop assert_predicate :any? and Rails messages"
status: draft
updated: 2026-09-25
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
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

- Rails: `assert_predicate get_prepared_statement_cache(...), :any?, "expected prepared statement cache to have something in it"`. trails (`packages/activerecord/src/hot-compatibility.test.ts`): `expect(getPreparedStatementCache(adapter).size > 0).toBeTruthy()`.
- Rails: `assert_empty ..., "expected prepared statement cache to be empty but it wasn't"`. trails: `assertEmpty(...)` with no message.

## Converged shape

Port the `assert_predicate :any?` form (`Hash#any?` on the Map through ruby-compat's Enumerable) and pass both Rails message strings.

## Acceptance criteria

- [ ] Both tests assert with `assertPredicate(…, "isAny", msg)` (or the settled `any?` spelling) and `assertEmpty(…, msg)`, with Rails' messages.
- [ ] `parity:test:assertions` shows no kind or message mismatch left in `hot_compatibility_test.rb`.
