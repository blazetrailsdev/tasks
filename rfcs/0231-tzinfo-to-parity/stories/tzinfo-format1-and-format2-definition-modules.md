---
title: "Port the Format2 definition modules and all of Format1"
status: draft
updated: 2026-11-14
rfc: "0231-tzinfo-to-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`tzinfo-format1-and-format2-definers` shipped the four Format2 definer classes
(`packages/tzinfo/lib/format2/{country,country-index,timezone,timezone-index}-definer.ts`),
`StringDeduper` and `CountryTimezone`. Still unported:

- `vendor/tzinfo/v2.0.6/lib/tzinfo/format2/country_index_definition.rb`,
  `timezone_definition.rb`, `timezone_index_definition.rb` — modules whose
  `append_features` extends `ClassMethods` onto the includer and seeds ivars
  (`@countries = {}.freeze`, `@timezones`/`@data_timezones`/`@linked_timezones`).
  Port with `include()` / `extend()` and the `included` hook (CLAUDE.md § "Module mixins").
- All of `vendor/tzinfo/v2.0.6/lib/tzinfo/format1/` (country_definer.rb subclasses
  Format2::CountryDefiner with `super(nil, ...)`; timezone_definer.rb subclasses
  Format2::TimezoneDefiner, `undef_method :subsequent_rules`, `offset` calls
  `abbreviation.to_s`, `transition(year, month, offset_id, timestamp_value, num, den)`
  raises 'DateTime-only transitions are not supported'; timezone_definition.rb
  extends Format2::TimezoneDefinition::ClassMethods then its own
  `timezone_definer_class`; country_index_definition.rb / timezone_index_definition.rb).
- `ConcurrentStringDeduper` (`string_deduper.rb:47-57`) was left out.

## Acceptance criteria

- [ ] The three Format2 `*_definition.rb` modules and all five `format1/` files are ported file for file.
- [ ] `vendor/tzinfo/v2.0.6/test/format1/*.rb` and `test/format2/tc_*_definition.rb` are ported by name.
