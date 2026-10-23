---
title: "Ported Rails assertion bodies call Vitest expect instead of Minitest helpers"
status: draft
updated: 2026-10-23
rfc: "0206-minitest-port-and-assertions-to-expect"
cluster: rails-bodies
packages: ["activesupport", "actionpack", "actionview", "activemodel", "activerecord"]
deps: ["call-gate-credits-minitest-asserts-as-expect"]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0206, owner ruling 2026-10-23: Minitest is not ported, so ported Rails
bodies that call a Minitest assert call Vitest `expect` instead, chosen by the
RFC's per-helper table, with Minitest's `msg` as `expect`'s second argument and
Minitest's `message { }` / `mu_pp` built in place (`rbInspect`). The Rails
methods keep their Rails names.

Sites (counts from `vendor/rails/v8.0.2/activesupport/lib/active_support/testing/`):
`assertions.rb` → `packages/activesupport/src/testing/assertions.ts`
(`assert` 5, `assert_equal` 2, `refute_equal` 1, `assert_nil` 1,
`assert_match` 1, `message` 27, `diff` 3, `mu_pp` 1);
`method_call_assertions.rb` → `method-call-assertions.ts` (`assert_equal` 2;
`assert_mock` 1 is left for the mock open question);
`error_reporter_assertions.rb` → `error-reporter-assertions.ts`
(`assert` 2, `assert_equal` 3, `assert_predicate` 2, e.g. `:99`). Plus:
`actionpack/src/action-dispatch/testing/assertions/routing.ts`,
`actionview/src/testing/selector-assertions.ts`,
`actionview/src/testing/selector-assertions/html-selector.ts`,
`actionview/src/testing/dom-assertions.ts`, `activemodel/src/lint.ts`,
`activerecord/src/testing/query-assertions.ts`,
`activerecord/src/encryption/test-helpers.ts`, and the five
`activesupport/src/cache/behaviors/*-behavior.ts`.

Example: `assert_difference`'s `assert_equal(before + diff, after, error)` is
`expect(after, error).toEqual(before + diff)`.

If the bodies are too many for one PR, split by package into sibling stories
(`tasks new`), not sibling PRs.

## Acceptance criteria

- [ ] None of the files above imports a Minitest assertion helper
      (`assertEqual`, `assertNil`, `assertPredicate`, `assertMatch`, `assert`,
      `refuteEqual`, `assertRespondTo`, `message`, `diff`).
- [ ] Each Rails Minitest call is one `expect` at the same position in the
      body, with the same message text where Rails passes one.
- [ ] Existing tests of these methods' failure messages stay green; where a
      Vitest failure text differs from Minitest's, the test asserts on the
      Rails-supplied `msg` part.
- [ ] `pnpm parity:api:calls` / `:calls:args` green with no new baseline rows
      (relies on `call-gate-credits-minitest-asserts-as-expect`).
