---
title: "Give NumericWithFormat#toFs the BigDecimal receiver Rails includes it into"
status: done
updated: 2026-08-15
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6569
claim: "2026-08-15T16:15:07Z"
assignee: "sqlite3-virtual-tables-return-pairs"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::NumericWithFormat` was ported in PR #6559
(`packages/activesupport/src/core-ext/numeric/conversions.ts`) with
`toFs(self: number, format, options)`, mirroring
`activesupport/lib/active_support/core_ext/numeric/conversions.rb:107-146`.

Rails mixes the module into three receivers at the bottom of that file
(`conversions.rb:148-150`):

```ruby
Integer.include ActiveSupport::NumericWithFormat
Float.include ActiveSupport::NumericWithFormat
BigDecimal.include ActiveSupport::NumericWithFormat
```

trails' port covers the Integer/Float receivers (both are a JS `number`) but not
`BigDecimal`, which trails models as its own class
(`packages/activesupport/src/core-ext/big-decimal/conversions.ts`,
`export class BigDecimal`). So the Rails assertions
`BigDecimal("1000010").to_fs(:human) # => "1 Million"` and
`BigDecimal("1000010").to_fs(:invalid) # => "1000010.0"`
(`activesupport/test/core_ext/numeric_ext_test.rb:412,421`) have no TS
counterpart, and were the two assertions left out when
`test_to_fs__injected_on_proper_types` / `test_to_fs_with_invalid_formatter`
were ported.

## Converged shape

`toFs` accepts the trails `BigDecimal` alongside `number`, dispatching the same
arms: the no-format arm returns `BigDecimal#toString()` (which already defaults
to Ruby's `"F"` form, so `"1000010.0"` falls out), and the format arms hand the
value to the `NumberHelper` converters. The two Rails assertions above then port
verbatim into their existing `it(...)` blocks.

## Acceptance criteria

- [ ] `NumericWithFormat.toFs` takes a `BigDecimal` receiver.
- [ ] `test_to_fs__injected_on_proper_types` and `test_to_fs_with_invalid_formatter`
      carry their BigDecimal assertions.
- [ ] No new `parity:api:extra` surface.
