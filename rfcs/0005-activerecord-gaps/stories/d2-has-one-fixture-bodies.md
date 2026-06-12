---
title: "D2 — fill has_one test fixture bodies (~24 fixture-gated tests)"
status: blocked
updated: 2026-05-29
rfc: "0005-activerecord-gaps"
cluster: associations
deps: []
deps-rfc: []
est-loc: 200
priority: 8
pr: null
claim: null
assignee: null
blocked-by: "Phase G fixture adoption (trails docs/activerecord/fixtures-adoption-plan.md) must land first"
---

## Context

~24 skipped has_one tests need their bodies written against fixtures that only
become available once Phase G fixture adoption lands.

## Acceptance criteria

- [ ] Test bodies written for the ~24 skipped has_one tests
- [ ] Tests pass against the Phase G fixtures (verbatim Rails names)

## Notes

From the associations gap plan (D2). External blocker: Phase G fixture adoption
(tracked in the trails fixtures-adoption-plan, not migrated as an RFC). Unblock
when that lands.
