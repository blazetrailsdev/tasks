---
title: "tzinfo periods read the std offset from tzdata, not a carried DST amount"
status: in-progress
updated: 2026-10-26
rfc: "0207-fugit-gem-family-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#9316
claim: "2026-10-25T23:24:49Z"
assignee: "differential-fuzz-fugit-family-against-ruby"
blocked-by: null
closed-reason: null
---

## Context

`packages/tzinfo/src/index.ts` `Timezone#periodForUtc` (trails#9306): when a DST period's offset differs from the offset at its isdst flip, the base is `observed - previous.stdOffset` from the period before `startAt()`. This assumes the DST amount stays the same across the offset-only transition. ruby tzinfo shows zones where it does not, e.g. `Asia/Hong_Kong` at -891579600 (previous observed 32400 / base 28800 → observed 30600 / base 32400). There the computed base is wrong. TZInfo 2 reads `base_utc_offset` and `std_offset` straight off each `TimezoneOffset` record.

## Acceptance criteria

- [ ] The vendored tzdata data (from `scripts/generate-tzdata-isdst.ts`, ruby tzinfo `transitions_up_to`) carries each transition's std offset, or its base offset.
- [ ] `periodForUtc` reads base/std from it, replacing the carry-over inference.
- [ ] A test covers Asia/Hong_Kong 1941 and America/Cancun 1998, checked against ruby tzinfo.
