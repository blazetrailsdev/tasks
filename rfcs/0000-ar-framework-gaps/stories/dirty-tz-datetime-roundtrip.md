---
title: "TZ-aware datetime string round-trip"
status: done
updated: 2026-06-06
rfc: "0000-ar-framework-gaps"
cluster: dirty-tracking
deps: []
deps-rfc: []
est-loc: 40
priority: 49
pr: 2982
claim: "2026-06-06T23:15:56Z"
assignee: "dirty-tz-datetime-roundtrip"
blocked-by: null
---

## Context

From `dirty-test-framework-gaps.md`. `created_on.in_time_zone("Tokyo").to_s`
reassignment should be a no-change; trails marks it dirty.

## Acceptance criteria

- [ ] Reassigning a TZ-shifted string form of the same instant is not a change.
- [ ] Un-skips: `datetime attribute doesnt change if zone is modified in string` (1).

## Notes

Rails: time-zone-aware attribute equality.
