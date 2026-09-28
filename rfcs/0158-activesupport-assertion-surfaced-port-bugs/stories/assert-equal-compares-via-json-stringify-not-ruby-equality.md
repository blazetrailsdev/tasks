---
title: "assertEqual compares via JSON.stringify, not Ruby == (all Hashes equal, key order significant)"
status: draft
updated: 2026-09-28
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

`packages/activesupport/src/testing/assertions.ts:770` `deepEqual` is
`JSON.stringify(a) === JSON.stringify(b)` for any two objects. It backs
`assertEqual` (`:688`), `refuteEqual` / `assertNotEqual` (`:703`) and
`caseEqual` (`:767`).

Minitest's `assert_equal` is `assert exp == act, msg`
(`vendor/minitest/lib/minitest/assertions.rb:220-222`), and `refute_equal` is
`refute exp == act`. Ruby `==` diverges from the JSON comparison in two
observable ways:

- **Every `Map` / ruby-compat `Hash` stringifies to `"{}"`**, so
  `assertEqual(new Hash([["a", 1]]), new Hash())` passes, and `assertNotEqual`
  of any two Hashes fails. `Hash#==` compares pairs.
- **Plain-object key order matters** to JSON but not to `Hash#==`, so
  `assertEqual({ a: 1, b: 2 }, { b: 2, a: 1 })` fails.

Found while porting actionpack's `CookieAssertions` (trails#8222,
`actionpack/test/abstract_unit.rb:366-483`). `assert_set_cookie_header`
compares per-cookie attribute hashes with `assert_equal`, which forced the
attribute hash to be a plain object. Using the faithful ruby-compat `Hash`
would have made the assertion vacuous.

## Acceptance criteria

- `deepEqual` is replaced by `rbEqual` (`ruby-compat/src/rb-equal.ts:15`, the
  `==` dispatch), extended if needed so that `Map`/`Hash` compare pairwise and
  plain objects compare order-independently, as Ruby `Hash#==` does.
- `assertEqual` / `assertNotEqual` / `caseEqual` all route through it.
- A regression test fails on the current body: unequal Hashes pass
  `assertEqual`, and reordered objects fail it.
- Once Hashes compare correctly, actionpack `test-helpers/abstract-unit.ts`
  `parseSetCookiesHeaders`'s per-cookie attributes are converged onto
  ruby-compat `Hash`.
