---
title: "assert_in_delta ports as toBeLessThanOrEqual (kind operator) instead of assertInDelta"
status: claimed
updated: 2026-09-21
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 5
pr: null
claim: "2026-09-21T13:56:49Z"
assignee: "port-assert-in-delta-as-indelta-not-operator"
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `dirty_test.rb`'s assertions in PR #7858, which found the
repo's existing idiom for `assert_in_delta` while looking for prior art.

Rails asserts a timestamp is within 1.1 seconds of now in two places, with the
identical line:

```ruby
# vendor/rails/activerecord/test/cases/fixtures_test.rb:484
assert_in_delta Time.now, aircraft.manufactured_at, 1.1
# vendor/rails/activerecord/test/cases/dirty_test.rb:952
assert_in_delta Time.now, aircraft.manufactured_at, 1.1
```

`dirty.test.ts` now ports it as `assertInDelta`, which normalizes to the
canonical kind `inDelta` (`scripts/test-compare/assertion-kinds.ts`,
`assert_in_delta: "inDelta"`).

`packages/activerecord/src/fixtures.test.ts:482-484` still ports it as:

```ts
expect(Math.abs(Time.now().toF() - (aircraft!.manufactured_at as Time).toF())).toBeLessThanOrEqual(
  1.1,
);
```

`toBeLessThanOrEqual` normalizes to `operator`, not `inDelta`, so that pair is a
permanent assertion-KIND mismatch for `fixtures_test.rb` no matter how the rest
of the file converges. It also inlines the delta arithmetic Minitest already
performs (`vendor/minitest/lib/minitest/assertions.rb:242`, `n = (exp - act).abs`).

The same pattern is worth grepping for beyond these two: `date_time_test.rb:26`
and `insert_all_test.rb:487,521` each carry an `assert_in_delta` whose port may
have reached for the same `toBeLessThanOrEqual` shape.

## Converged shape

`assertInDelta(Time.now().toF(), (aircraft!.manufactured_at as Time).toF(), 1.1)`
— Rails' operand order and Rails' `1.1`, with the subtraction left to the
helper. `assertInDelta` is already exported from `@blazetrails/activesupport`
(added by PR #7858) and is a line-for-line port of `assertions.rb:241-247`.

## Acceptance criteria

- [ ] `fixtures.test.ts`'s `assert_in_delta` port uses `assertInDelta` and
      reports kind `inDelta`.
- [ ] Every other `assert_in_delta` in the activerecord test closure is ported
      the same way — check `date_time_test.rb:26` and
      `insert_all_test.rb:487,521` and their TS counterparts.
- [ ] `pnpm parity:test -- --package activerecord --assertions` shows no
      `operator`-vs-`inDelta` row for any of those files.
- [ ] No test renamed; `pnpm parity:test` percent for activerecord does not drop.
