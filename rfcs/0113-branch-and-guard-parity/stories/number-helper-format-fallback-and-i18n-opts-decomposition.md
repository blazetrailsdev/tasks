---
title: "Percentage converter invents a format fallback; currency converter inlines i18n_opts"
status: done
updated: 2026-09-05
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 21
pr: 7504
claim: "2026-09-05T01:42:09Z"
assignee: "type-registry-key-replaces-per-adapter-overrides"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while verifying `converge-number-helper-percentage-currency-converters`
(PR #7263 — the two converter bodies named there were already converged by #6513, but two smaller divergences in the same pair are still open).

### 1. An invented `format` fallback in the percentage converter

`vendor/rails/activesupport/lib/active_support/number_helper/number_to_percentage_converter.rb:10-13`:

```ruby
def convert
  rounded_number = NumberToRoundedConverter.convert(number, options)
  options[:format].gsub("%n", rounded_number)
end
```

Rails reads `options[:format]` and would `NoMethodError` on nil — the
defaults always supply it. `packages/activesupport/src/number-helper/
number-to-percentage-converter.ts:12` adds a guard Rails does not have:

```ts
const format = (options.format ?? "%n%") as string;
```

That `"%n%"` literal duplicates the default that belongs in the locale
defaults, and it silently papers over a missing-defaults bug instead of
surfacing it.

### 2. `i18n_opts` is inlined into `formatOptions`

`number_to_currency_converter.rb:29-45` has two private methods — `options`
(memoized `default_format_options.merge(i18n_opts)`, then the
`opts[:format]` negative-format override, then `merge!(opts)`) and
`i18n_opts` (sets the International negative format when the i18n format
exists). trails' `number-to-currency-converter.ts:18-31` collapses both
into a single `formatOptions()` override, so one Rails method is not one
TS method and `i18n_opts` has no counterpart at all.

## Converged shape

1. Read `options.format` directly, with the `"%n%"` default living in the
   locale/default format options where Rails puts it.
2. Split `formatOptions()` back into the two Rails methods, keeping the
   Rails names (`options` and `i18nOpts` per
   `docs/ruby-ts-conventions.md`), with the same memoization and the same
   merge order.

## Acceptance criteria

- [ ] `NumberToPercentageConverter#convert` carries no `??` fallback for
      `format`; the default reaches it through the format options.
- [ ] `NumberToCurrencyConverter` has a distinct `i18nOpts` mirroring
      `number_to_currency_converter.rb:39-44`, called from the `options`
      counterpart, with Rails' merge order preserved.
- [ ] `pnpm vitest run packages/activesupport/src/number-helper` green.
- [ ] `pnpm parity:api --package activesupport` delta non-negative and no
      new `parity:api:extra` untagged surface.
