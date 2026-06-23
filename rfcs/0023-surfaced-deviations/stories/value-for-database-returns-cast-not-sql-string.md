---
title: "value_for_database returns the cast value (not the serialized SQL string), matching Rails"
status: done
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
priority: 40
pr: 3956
claim: "2026-06-23T02:27:16Z"
assignee: "value-for-database-returns-cast-not-sql-string"
blocked-by: null
---

## Context

trails' attribute `valueForDatabase` (used by `forgettingAssignment` and by
INSERT bind construction at `packages/activerecord/src/base.ts:3019`
`valuesForDatabase()`) returns the **serialized SQL string** for the DateTime
type (`packages/activemodel/src/type/date-time.ts:190` `serialize()` →
`temporal.toString(...)`). Rails diverges: `ActiveModel::Type::Value#serialize`
is near-identity and `value_for_database` for the DateTime type returns the cast
**Time** object — the connection adapter does the SQL-string quoting later. So in
Rails, after `forget_attribute_assignments`, a timestamp's
`value_before_type_cast` is a Time; in trails it is a SQL string.

PR #3699 (story create-record-timestamp-came-from-user) worked around this for
the create path only, via a post-hoc `AttributeSet#rebindFromDatabaseValue` that
rebinds create-time timestamps to their cast value after `changesApplied`. The
underlying conflation (serialize == value_for_database) remains for every other
save/forget path and every other type whose Rails `serialize` differs from its
SQL form.

## Acceptance criteria

- [x] `value_for_database` for the DateTime (and other affected) types returns
      the cast value, matching Rails; SQL-string quoting moves to the bind/quote
      layer so INSERT/UPDATE still emit correct SQL.
- [x] `forgetting_assignment` produces a `FromDatabase` whose
      `value_before_type_cast` is the cast value for all save paths, not just
      create — letting PR #3699's bespoke `rebindFromDatabaseValue` workaround in
      `callbacks.ts` `_createRecord` be removed.
- [x] No regression in cache-key, dirty (incl. TZ-aware), persistence, or
      timestamp suites; api:compare / test:compare delta non-negative.

## Notes

This is the root-cause convergence behind the create-time-timestamp workaround.
Likely cross-cutting (binds, quoting, all adapters) — size accordingly and
consider splitting per type or per path if it exceeds the 500 LOC ceiling.
