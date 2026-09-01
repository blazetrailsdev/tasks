---
title: "BigDecimal cannot construct Infinity or NaN; MRI does"
status: draft
updated: 2026-08-31
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`BigDecimal` in `packages/activesupport/src/core-ext/big-decimal/conversions.ts:53`
throws `TypeError: BigDecimal: cannot parse Infinity` for `Infinity`, `-Infinity`
and `NaN`. Ruby's BigDecimal accepts all three — verified against MRI on this
host:

```console
$ ruby -rbigdecimal -e 'p BigDecimal(Float::INFINITY); p BigDecimal(Float::NAN)'
Infinity
NaN
```

This surfaced while converging
`packages/activerecord/src/adapters/sqlite3/quoting.test.ts` onto Rails'
`vendor/rails/activerecord/test/cases/adapters/sqlite3/quoting_test.rb`
(story `sqlite3-quoting-test-asserts-quoting-not-roundtrips`). Two of the Rails
cases assert the BigDecimal arms of the sqlite3 `quote` override
(`sqlite3/quoting.rb:56-60`, the `Numeric`/`finite?` branch):

```ruby
def test_quote_numeric_infinity
  assert_equal "'Infinity'", @conn.quote(Float::INFINITY)
  assert_equal "'-Infinity'", @conn.quote(-Float::INFINITY)
  assert_equal "'Infinity'", @conn.quote(BigDecimal(Float::INFINITY))
  assert_equal "'-Infinity'", @conn.quote(BigDecimal(-Float::INFINITY))
end

def test_quote_float_nan
  assert_equal "'NaN'", @conn.quote(Float::NAN)
  assert_equal "'NaN'", @conn.quote(BigDecimal(Float::NAN))
end
```

The Float arms landed; the three `BigDecimal(...)` arms could not be written
because the constructor raises. They are the only assertions missing from that
file relative to Rails.

Note trails' sqlite3 `quote` (`connection-adapters/sqlite3/quoting.ts:70`) only
tests `typeof value === "number" && !Number.isFinite(value)`, so it will also
need a `BigDecimal` arm once non-finite BigDecimals exist — Rails' `when Numeric`
covers both.

## Acceptance criteria

- [ ] `new BigDecimal(Infinity)`, `new BigDecimal(-Infinity)` and
      `new BigDecimal(NaN)` construct, and `toString("F")` / `inspect` render
      `Infinity` / `-Infinity` / `NaN` as MRI does.
- [ ] Arithmetic, comparison and `isFinite`-style predicates behave as Ruby's
      BigDecimal does for these values (check `vendor/` and MRI directly).
- [ ] sqlite3 `quote` renders a non-finite BigDecimal as `'Infinity'` /
      `'-Infinity'` / `'NaN'`, matching `sqlite3/quoting.rb:56-60`'s `Numeric`
      branch.
- [ ] The three `BigDecimal(...)` arms are restored to
      `test_quote_numeric_infinity` / `test_quote_float_nan` in
      `packages/activerecord/src/adapters/sqlite3/quoting.test.ts`.
