---
title: "base-test-copytable-readonly-includes"
status: done
updated: 2026-06-15
rfc: "0016-ar-test-compare-100"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3321
claim: "2026-06-15T02:35:25Z"
assignee: "base-test-copytable-readonly-includes"
blocked-by: null
---

## Context

Carved out of [[f9g3b2-base-test-timezone-and-misc]] (PR shipped the
time-zone string-cast slice). These `base_test.rb` matched-skips each need a
real source feature and are separable from the time-zone work:

- `copy table with id` (base.test.ts ~L768) — `copy_table` DDL.
- `implicit readonly on left joins` (base.test.ts ~L1265) — relation marks
  records readonly when a LEFT JOIN is present without explicit select.
- `find applies includes with default scope` (base.test.ts ~L1401).
- `includes eager loads associations` (base.test.ts ~L1630).
- `incomplete schema loading` (base.test.ts ~L1636).

Group by feature; if total exceeds 300 LOC register further stories, do not
fan out PRs.

## Acceptance criteria

- [ ] Drive the listed matched-skips to zero by implementing the backing
      source feature; names match Rails verbatim.
- [ ] ≤300 LOC; single draft PR from main; run /link.
