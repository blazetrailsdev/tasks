---
title: "f9g3b2-base-test-timezone-and-misc"
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

Tail of [[f9g3b-persistence-feature-gap-tail]] (PR #3236 shipped the view
primary-key slice). These `base_test.rb` matched-skips each need a real source
feature, carved out to keep #3236 under the 300 LOC ceiling:

- utc/local time-zone casting (`default_timezone` + Topic fixture) —
  `utc as time zone`, `attributes on dummy time`, `default in local time`,
  `switching default time zone`, `mutating time objects`.
- connection in local/utc time (`establish_connection` per-connection
  `default_timezone`) — `connection in local time`, `connection in utc time`.
- `copy table with id` (copy_table DDL), `implicit readonly on left joins`,
  `find applies includes with default scope`, `includes eager loads
associations`, `incomplete schema loading`.

Group the time-zone tests into one PR; copy_table / readonly / includes are
separable if the total exceeds 300 LOC (register further stories, do not fan
out PRs).

## Acceptance criteria

- [ ] Drive the listed `base.test.ts` matched-skips to zero by implementing the
      backing source feature; test names match Rails verbatim.
- [ ] ≤300 LOC; touched files only (CLAUDE.md — no full-suite run).
- [ ] Single PR from main, opened draft; run /link.
