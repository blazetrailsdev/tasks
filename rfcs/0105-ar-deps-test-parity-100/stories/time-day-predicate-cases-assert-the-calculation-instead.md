---
title: "Ten time_ext day-predicate cases assert the calculation, not the predicate"
status: draft
updated: 2026-09-05
rfc: "0105-ar-deps-test-parity-100"
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

Ten name-matched cases in
`packages/activesupport/src/core-ext/time-ext.test.ts` assert a **different
method** than the Rails case whose name they carry: Rails tests the _predicate_
(`prev_day?`, `next_day?`, `today?`, `yesterday?`, `tomorrow?`) under a stubbed
`Date.current`; the port calls the _calculation_ (`prevDay()`, `nextDay()`) and
asserts the returned date.

Rails, `vendor/rails/activesupport/test/core_ext/time_ext_test.rb:1002-1054`:

```ruby
def test_prev_day_with_time_local
  Date.stub(:current, Date.new(2000, 1, 1)) do
    assert_equal true,  Time.local(1999, 12, 31, 23, 59, 59).prev_day?
    assert_equal false, Time.local(2000, 1, 1, 0).prev_day?
    assert_equal true,  Time.local(1999, 12, 31).prev_day?
    assert_equal false, Time.local(2000, 1, 2, 0).prev_day?
  end
end
```

trails, `packages/activesupport/src/core-ext/time-ext.test.ts` — e.g. `prev day
with time local`:

```ts
const t = new Date();
const result = asDate(prevDay(t));
expect(result < t).toBe(true);
```

The affected pairs (each has a `_with_time_local` and a `_with_time_utc` arm):
`test_today_*` (`time_ext_test.rb:966-999`), `test_prev_day_*` (`1002-1018`),
`test_tomorrow_*` (`1020-1036`), `test_next_day_*` (`1038-1054`), and
`test_yesterday_*` alongside them.

Consequences: the predicates `prevDay?`/`nextDay?`/`today?`/`yesterday?`/
`tomorrow?` on the `Time` receiver are effectively uncovered, the `Date.current`
stub arm is absent entirely, and each case shows as an assertion-count mismatch
(rails 4 vs trails 1-2) in `pnpm parity:test --assertions`, which is where this
was surfaced (#7500). Renaming the tests is not an option — names are the
matching key — so the fix is to make the bodies test what Rails tests.

## Acceptance criteria

- Each of the listed cases calls the predicate Rails calls, on the receiver
  Rails uses (`Time.local` / `Time.utc` equivalents), with `Date.current`
  stubbed to `Date.new(2000, 1, 1)` as Rails does.
- Assertion count and kind per case match Rails (4 `assert_equal` each), so
  `pnpm parity:test:assertions` counters for `core_ext/time_ext_test.rb` fall;
  tighten the activesupport mark afterwards with the narrow tighten verb, never
  a reseed.
- Any predicate the port lacks is ported (or filed) rather than worked around —
  `vendor/rails/activesupport/lib/active_support/core_ext/date_and_time/calculations.rb`
  is the Rails home for `prev_day?`/`next_day?`/`today?`/`yesterday?`/`tomorrow?`.
- No test name changes.
