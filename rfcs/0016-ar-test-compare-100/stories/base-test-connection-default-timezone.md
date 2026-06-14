---
title: "base-test-connection-default-timezone"
status: draft
updated: 2026-06-14
rfc: "0016-ar-test-compare-100"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Carved out of [[f9g3b2-base-test-timezone-and-misc]] (PR shipped the
`5:42:00AM` string-time-cast slice via `looseDateParse` seconds support).

These two `base_test.rb` matched-skips need per-connection `default_timezone`
through `establish_connection` — `ActiveRecord::Base.establish_connection`
with a config that merges `default_timezone: "local"|"utc"`, then
`reset_column_information`. The connection pool / SchemaAdapter does not yet
support reconnecting with a new config.

- `connection in local time` (base.test.ts ~L2258)
- `connection in utc time` (base.test.ts ~L2261)

## Acceptance criteria

- [ ] Implement per-connection `default_timezone` via `establish_connection`.
- [ ] Unskip both tests; names match Rails verbatim.
- [ ] ≤300 LOC; single draft PR from main; run /link.
