---
title: "activerecord: time-zone-converter.test.ts holds 11 trails-only cases in a Rails-mapped file"
status: ready
updated: 2026-09-06
rfc: "0134-activemodel-surfaced-deviations"
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

Surfaced by PR #7551, which had to delete one case from
`packages/activerecord/src/attribute-methods/time-zone-converter.test.ts`
(`"falls back to ActiveRecord.default_timezone when the subtype has no
is_utc?"`) because it pinned an invention that story removed.

That deletion put the file's shape in front of us: it is a **Rails-mapped**
file — `activerecord/test/cases/attribute_methods/time_zone_converter_test.rb`
— and that Rails file defines exactly ONE test,
`def test_comparison_with_date_time_type` (`time_zone_converter_test.rb:10`).
After #7551 the trails file holds 12 cases, of which 1 mirrors that Rails test
(`"comparison with date time type"`) and 11 are trails-only:

```text
cast returns null for null/undefined
cast wraps Temporal.Instant in TimeWithZone for current zone
cast wraps Temporal.ZonedDateTime in current zone
cast moves existing TimeWithZone to current zone
cast parses offset-less string as local to current zone (not default_timezone)
cast parses string with offset as absolute instant then wraps in zone
cast returns raw subtype result when no zone is configured
cast raises for plain object with non-multiparameter keys
deserialize wraps Temporal.Instant from subtype in TimeWithZone
serialize forwards the TimeWithZone to the subtype untouched
serialize round-trips: deserialize then serialize returns the cast value
```

Trails-only cases in a Rails-mapped file are the shape
`serializers-json-test-file-is-trails-only-but-unmarked` (done, #7551) fixed for
ActiveModel's serializers directory, and the same remedy applies here.

One of the 11 also encodes a deviation rather than Rails behaviour:
`"cast returns raw subtype result when no zone is configured"` pins trails'
`if (!zone) return value` guard, which Rails does not have — `::Time.zone` is
set in every AR context and Rails would raise `NoMethodError` on nil. #7551
removed that guard from `set_time_zone_without_conversion` but the test still
describes the old contract through another path.

## Converged shape

The 11 trails-only cases move verbatim into
`attribute-methods/time-zone-converter.trails.test.ts`, leaving the mapped file
holding only `comparison with date time type`. **No test name changes** — this
is a move, exactly as #7551 did for `json.test.ts`. Check each case against
`time_zone_converter_test.rb` before moving it rather than moving the block
wholesale.

While there, decide whether `"cast returns raw subtype result when no zone is
configured"` should survive the move at all or be filed as its own convergence:
it asserts a guard Rails has no counterpart for.

`pnpm parity:test` activerecord percent must not drop and
`scripts/test-compare/assertion-mismatch-mark.json` must not rise.

Related: [[serializers-json-test-file-is-trails-only-but-unmarked]] (done, PR
PR #7551 is the same shape in activemodel and is the worked example.

## Acceptance criteria

- [ ] Each of the 12 cases is checked against `time_zone_converter_test.rb` and
      classified trails-only or Rails-mirroring.
- [ ] Trails-only cases live in `time-zone-converter.trails.test.ts`; the mapped
      file holds only Rails-mirroring cases under their verbatim Rails names.
- [ ] No test name changes; `pnpm parity:test` activerecord percent does not
      drop; the assertion-mismatch mark is not raised.
