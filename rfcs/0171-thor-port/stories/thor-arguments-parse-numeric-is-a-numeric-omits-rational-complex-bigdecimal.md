---
title: "Arguments#parse_numeric's is_a?(Numeric) omits Rational, Complex and BigDecimal; port a ruby-compat Numeric kind-of test"
status: ready
updated: 2026-10-04
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Thor::Arguments#parse_numeric` returns `shift if peek.is_a?(Numeric)`
(`vendor/thor/v1.3.2/lib/thor/parser/arguments.rb:140`).
`packages/trailties/src/thor/parser/arguments.ts:167` ports the test as
`typeof this.peek() === "number" || typeof this.peek() === "bigint"`, which
is Integer and Float only. Ruby's `Numeric` also covers `Rational`,
`Complex` and `BigDecimal`, all of which ruby-compat ports
(`packages/ruby-compat/src/rational.ts`, `complex.ts`, `big-decimal.ts`).

`TablePrinter#format_cell` (`vendor/thor/v1.3.2/lib/thor/shell/table_printer.rb:75`,
`packages/trailties/src/thor/shell/table-printer.ts`) spells the full test
inline since trails#8375. The same five-arm test now exists in one place and
is missing in the other; ruby-compat has no `Numeric` kind-of predicate
(`rbIntegerTypeP` / `rbFloatTypeP` only, `packages/ruby-compat/src/numeric.ts`).

## Acceptance criteria

- [ ] ruby-compat ports the `rb_obj_is_kind_of(x, rb_cNumeric)` test MRI runs
      for `is_a?(Numeric)` (`vendor/ruby/v3.3.11/object.c`), covering Integer,
      Float, Rational, Complex and BigDecimal.
- [ ] `Arguments#parseNumeric` and `TablePrinter#formatCell` both call it, so
      a `Rational` peek is shifted as Thor shifts it.
- [ ] A `.trails.test.ts` case pins the `Rational` arm of `parseNumeric`.
