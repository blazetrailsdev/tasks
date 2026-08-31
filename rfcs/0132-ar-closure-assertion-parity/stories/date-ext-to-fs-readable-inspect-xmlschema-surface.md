---
title: "date-ext-to-fs-readable-inspect-xmlschema-surface"
status: ready
updated: 2026-08-17
rfc: "0132-ar-closure-assertion-parity"
cluster: assertion-parity
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

Sibling of `assertions-activesupport-core-ext-date-time-duration` (RFC 0105),
which took `core_ext/date_ext_test.rb` from 55 assertion divergences to 9. The
9 that remain all need production surface the `activesupport` Date core_ext has
not ported yet, not an assertion edit:

| trails test (`core-ext/date-ext.test.ts`)                 | blocked on                                                                                                                                                                             |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `to fs` (10 vs 1), `to fs with single digit day` (7 vs 1) | `Date#to_fs` / `to_formatted_s` with the `:short` / `:long` / `:long_ordinal` / `:db` / `:inspect` / `:rfc822` / `:rfc2822` / `:iso8601` formats (`core_ext/date/conversions.rb:1-40`) |
| `readable inspect` (2 vs 1)                               | `Date#readable_inspect` / the `inspect` alias (`core_ext/date/conversions.rb`)                                                                                                         |
| `to time` (4 equal + 1 raises vs 1)                       | `Date#to_time(form)` rejecting an unknown form with `ArgumentError` (`core_ext/date/conversions.rb`)                                                                                   |
| `xmlschema` (4 match vs 1)                                | `Date#xmlschema` answering the zone-offset ISO 8601 string Rails' `assert_match(/^1980-02-28T00:00:00-05:?00$/, ...)` expects                                                          |

Rails source: `vendor/rails/activesupport/lib/active_support/core_ext/date/conversions.rb`;
Rails test: `vendor/rails/activesupport/test/core_ext/date_ext_test.rb:24-72,313-332`.

## Acceptance criteria

- `core_ext/date_ext_test.rb` reports 0 assertion-count, 0 assertion-kind and 0
  assertion-value mismatches in `pnpm parity:test -- --assertions --package activesupport`.
- The methods above are ported at their Rails names in the Rails file, not
  stubbed in the test.
- `scripts/test-compare/assertion-mismatch-mark.json` lowered by exactly this
  story's contribution.
