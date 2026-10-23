---
title: "Call gate credits a Minitest assert in a Rails body as its expect matcher"
status: draft
updated: 2026-10-23
rfc: "0206-minitest-port-and-assertions-to-expect"
cluster: assertion-tooling
packages: ["activesupport"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0206, owner ruling 2026-10-23: a ported Rails body that calls a Minitest
assert is written as Vitest `expect` (§ "Minitest asserts inside ported Rails
bodies"). Today `parity:api:calls` would report each such Rails call
(`assert_equal`, `assert_nil`, `assert_predicate`, `assert_respond_to`,
`assert_match`, `assert`, `refute_equal`, `assert_mock`, and the message
machinery `message` / `diff` / `mu_pp`) as missing, because the TS body calls
`expect(...)` and a matcher instead.

The Minitest → matcher mapping already exists twice: CONTRIBUTING.md
§ "Porting a Minitest assertion" (prose table) and
`scripts/test-compare/assertion-kinds.ts` (`RAILS_MAP` / `TRAILS_MAP`,
`:263-269`, `:367-382`), which the assertion-kind gate uses on test files.
Rails' own sites: `vendor/rails/v8.0.2/activesupport/lib/active_support/testing/assertions.rb`,
`method_call_assertions.rb`, `error_reporter_assertions.rb`, plus the eleven
Rails-mirroring files listed in the RFC.

## Acceptance criteria

- [ ] The call-set gate (`scripts/api-compare/lint-calls.ts`) credits a Ruby
      call to a Minitest assert when the TS body has an `expect(...)` chain
      whose terminal matcher maps to that assert's kind, reading the mapping
      from `assertion-kinds.ts` (one table; no second copy).
- [ ] `message`, `diff` and `mu_pp` are credited as folded into `expect`'s
      message argument (an `expect(x, msg)` call with two arguments), not
      requiring a separate call.
- [ ] The call-argument gate (`parity:api:calls:args`) does not pair a
      Minitest assert site against an `expect` site as an args mismatch.
- [ ] Unit tests in `scripts/api-compare/` cover: a mapped pair credited, an
      unmapped matcher not credited, a negated matcher (`.not.toEqual`)
      crediting `refute_equal`.
- [ ] No `@missingRailsCall` receipt or baseline row is added for a Minitest
      assert anywhere.
