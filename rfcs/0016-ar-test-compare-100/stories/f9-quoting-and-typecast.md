---
title: "F-9c — quoting + type-cast edge cases"
status: claimed
updated: 2026-06-12
rfc: "0016-ar-test-compare-100"
cluster: core-residuals
deps: []
deps-rfc: []
est-loc: 200
priority: 13
pr: null
claim: "2026-06-12T20:16:51Z"
assignee: "f9-quoting-and-typecast"
blocked-by: null
---

## Context

From the 2026-06-10 snapshot. `quoting_test.rb` (13 matched-skips) plus
`numeric_data_test.rb` (1) and `timestamp_test.rb` (1). Skips: `quote duration`,
`quote table name calls quote column name`, `quoted timestamp/time/datetime
local|utc`, `quote bigdecimal`, `dates and times`, `quote as mb chars no column`,
`type cast time`.

## Acceptance criteria

- [ ] Implement the quoting / type-cast behaviors so the listed tests pass un-skipped.
- [ ] `quoting_test.rb` reaches 0 matched-skips.
- [ ] Touched test files only.

## Notes

Rails: `activerecord/test/cases/quoting_test.rb` + `connection_adapters/quoting.rb`.
`quote as mb chars` needs ActiveSupport::Multibyte::Chars handling.
