---
title: "Give Minitest assert_nil / refute_nil a home date, i18n, rack and rack-session can import"
status: draft
updated: 2026-09-30
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: ["date", "i18n", "rack", "rack-session"]
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`assert-nil-helper-sweep-remaining-packages` swept every package outside
activerecord (arel, globalid, rack-test, actionview, activesupport, trailties,
actionpack) onto `assertNil` / `assertNotNil`
(`packages/activesupport/src/testing/assertions.ts`, re-exported from
`@blazetrails/activesupport`). Rails' `assert_nil` is Minitest's, and
`assert_not_nil` is the `refute_nil` alias at
`vendor/rails/v8.0.2/activesupport/lib/active_support/test_case.rb:244`.
`expect(x).not.toBeNull()` passes on `undefined`, which is the miss
`assert_not_nil` exists to catch.

Method used there, repeat it here: run `pnpm parity:test --json`, then pair each
TS test in `scripts/test-compare/output/ts-tests.json` (non-`.trails` files)
that carries `toBeNull` / `not:toBeNull` kinds with the Rails test of the same
normalized description in `rails-tests.json`. Swap every site in a test whose
`toBeNull` / `not:toBeNull` counts equal the Rails test's `assert_nil` /
`assert_not_nil` counts. Where the counts differ, read the Rails body and swap
only the lines that port an `assert_nil`. Leave TS tests with no Rails
counterpart alone. The comparer scores `toBeNull` as `nil` and `not:toBeNull`
as `notNil` (`scripts/test-compare/assertion-kinds.ts:52,171`), the same kinds
as `assertNil` / `assertNotNil`, so the swap is count/kind/value neutral. The
sibling PR confirmed this with an A/B of `convention-comparison.json` totals.

Four packages that port Ruby gems with Minitest / test-unit suites still spell
`assert_nil` as `toBeNull` and cannot reach `assertNil`: as of 2026-09-30, date
51 count-matched sites, rack 60 (plus 14 in count-mismatched tests, e.g.
`must_be_nil` specs), i18n 5, rack-session 1. None of them depends on
`@blazetrails/activesupport`, and date and i18n cannot: activesupport depends on
`@blazetrails/date`, `@blazetrails/i18n` and `@blazetrails/ruby-compat`
(`packages/activesupport/package.json`), so importing it back would close a
workspace cycle. Rack does not depend on activesupport in Ruby either.

The Ruby source of the helper is Minitest, not ActiveSupport:
`vendor/minitest/v5.27.0/lib/minitest/assertions.rb:305-308` (`assert_nil`)
and its `refute_nil` twin. The minitest gem is vendored but has no TS package.
`assertNil` / `assertNotNil` live in activesupport's `testing/assertions.ts` for
want of one. The design question this story has to settle first: where a
Minitest assertion can live so that date, i18n, rack and rack-session reach it
without a cycle. Candidates: a package that mirrors `minitest/assertions.rb`,
below date and i18n in the graph, which activesupport re-exports. Check RFC
0098's `map-vendored-minitest-and-drop-norailsequivalent` first, since it
touches the same mapping.

## Acceptance criteria

- [ ] `assert_nil` / `refute_nil` (and `must_be_nil` / `wont_be_nil`) have a TS home that date, i18n, rack and rack-session can import without a workspace dependency cycle. activesupport's `assertNil` / `assertNotNil` stay exported from `@blazetrails/activesupport`.
- [ ] Every `toBeNull` / `.not.toBeNull()` in those four packages that ports one of those Ruby assertions uses the helper.
- [ ] `pnpm parity:test:assertions` stays OK with unchanged mismatch totals.
