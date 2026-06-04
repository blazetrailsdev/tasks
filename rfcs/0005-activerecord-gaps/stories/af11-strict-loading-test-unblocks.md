---
title: "AF11 — wire remaining strict-loading test stubs"
status: ready
rfc: "0005-activerecord-gaps"
cluster: associations
deps: []
deps-rfc: []
est-loc: 90
priority: 33
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

~6 strict-loading tests across `persistence.ts`, the association loaders, and
`strict-loading.test.ts` are stubbed: record-reload interaction, unloaded-reader
lazy proxy, validation-context, and eager has_one opt-in. The AF7 prerequisite is
satisfied (#2645).

## Acceptance criteria

- [ ] Record reload interaction with strict_loading handled
- [ ] Unloaded-reader returns a lazy proxy under strict_loading
- [ ] Validation-context strict-loading case passes
- [ ] Eager has_one opt-in case passes
- [ ] The ~6 stubbed `strict-loading.test.ts` cases unskipped and green

## Notes

From the associations gap plan (AF11), ready now.
