---
title: "Clusivity#inclusion_method tests the JS Date and number where Rails names Numeric, Time, DateTime, Date"
status: ready
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
cluster: null
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Read while converging `Clusivity#include?` in trails PR 8411.

`Clusivity#inclusion_method`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/validations/clusivity.rb:40-52`) picks
`:cover?` for a Range whose first endpoint is `Numeric, Time, DateTime, Date`, and `:include?`
otherwise:

```ruby
case enumerable.begin || enumerable.end
when Numeric, Time, DateTime, Date
  :cover?
else
  :include?
end
```

`inclusionMethod` (`packages/activemodel/src/validations/clusivity.ts`) tests
`typeof endpoint === "number" || endpoint instanceof Date`, under a `// boundary:` comment. That
is the JS `Date`, not the classes Rails names. A `bigint`, a `Rational`, a `BigDecimal`, and the
`Time` / `Date` / `DateTime` of `@blazetrails/date` all take the `include?` arm where Rails takes
`cover?`. It also reads the endpoint with `??`, where Ruby's `||` skips a `false` begin.

The answer is the same today only because ruby-compat's `Range#isInclude` falls back to `cover`
for a non-String range; the method selection itself is not Rails'.

## Converged shape

One `case` over the endpoint, in Rails' order, matching Ruby's `Numeric` (a JS number, a bigint,
`Rational`, `BigDecimal`) and the three date classes from `@blazetrails/date`, answering `"cover"`;
everything else `"isInclude"`. No `instanceof Date` on the JS built-in and no comment.

## Acceptance criteria

- [ ] `inclusionMethod` answers `"cover"` for a Range of `Time`, `Date`, `DateTime`, `Rational`,
      `BigDecimal` or bigint endpoints, and `"isInclude"` for a String range.
- [ ] A test in `clusivity.trails.test.ts` pins the selected method per endpoint class.
- [ ] `inclusion-validation.test.ts` and `exclusion-validation.test.ts` stay green.
