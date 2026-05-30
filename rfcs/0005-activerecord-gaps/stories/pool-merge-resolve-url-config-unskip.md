---
title: "Unskip 7 merge-and-resolve-default-url-config tests"
status: blocked
rfc: "0005-activerecord-gaps"
cluster: connection-pool
deps: []
deps-rfc: []
est-loc: 20
pr: null
claim: null
assignee: null
blocked-by: "ConnectionHandler must be fully ported (P9 scope)"
---

## Context

7 tests in `merge-and-resolve-default-url-config.test.ts` are already written but
skipped pending the full `ConnectionHandler` port (P9). Purely a blocker-removal
task once P9 lands.

## Acceptance criteria

- [ ] The 7 skipped tests unskipped and green once `ConnectionHandler` (P9) lands

## Notes

From the connection-pool gap plan (PF merge-resolve). Blocked on P9.
