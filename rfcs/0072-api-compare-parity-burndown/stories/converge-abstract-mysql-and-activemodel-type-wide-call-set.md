---
title: "converge-abstract-mysql-and-activemodel-type-wide-call-set"
status: done
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5374
claim: "2026-07-26T23:02:56Z"
assignee: "converge-abstract-mysql-and-activemodel-type-wide-call-set"
blocked-by: null
closed-reason: null
---

## Context

Fallout cluster from the #5334 include-resolution reseed, surviving the
delegation-transparency gate added by
`burn-down-mixin-driven-wide-ratchet-expansion`. The tail of the reseed: 6
entries in
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/connection-adapters/abstract-mysql-adapter.json`
plus 6 across
`scripts/api-compare/call-mismatches-wide-exclude/activemodel/type/{time,date-time,decimal}.json`.

Anchors:
`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb`,
`vendor/rails/activemodel/lib/active_model/type/{time,date_time,decimal}.rb` and
`.../type/helpers/time_value.rb`.

- abstract-mysql: `build_explain_clause` drops `include?`, `join`;
  `write_query?` drops `match?`; `returning_column_values` drops `first`;
  `type_cast` drops `getlocal`, `utc?`.
- `Type::Time#serialize_cast_value` and `Type::DateTime#serialize_cast_value`
  drop `apply_seconds_precision` and `getlocal`. The dropped
  `apply_seconds_precision` is a real fidelity gap: a column with a
  `precision:` must truncate sub-second digits on serialize. `getlocal` is the
  `default_timezone == :local` branch — see
  [[project_arel_reaches_default_timezone_via_activemodel]] and
  [[project_js_date_rejected_temporal_is_time_analogue]] for how trails models
  Ruby `Time`.
- `Type::Decimal#changed?` drops `equal_nan?` and `number_to_non_number?` —
  Rails' dirty check treats NaN-to-NaN as unchanged and number-to-non-number as
  changed; verify trails does not report a spurious change.

## Acceptance criteria

- Converge `serialize_cast_value` on Time/DateTime to apply seconds precision
  and honour the local-timezone branch, with regression tests that fail on the
  current implementation.
- Converge `Decimal#changed?` onto Rails' `equal_nan?` /
  `number_to_non_number?` predicates.
- Converge the abstract-mysql bodies or record a specific per-entry `reason`.
- `pnpm parity:api:calls` passes with a strictly smaller baseline.
- Tests named verbatim after
  `vendor/rails/activemodel/test/cases/type/{time_test,date_time_test,decimal_test}.rb`
  and the Rails mysql adapter cases.
