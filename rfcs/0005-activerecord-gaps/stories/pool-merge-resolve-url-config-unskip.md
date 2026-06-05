---
title: "Unskip 7 merge-and-resolve-default-url-config tests"
status: done
rfc: "0005-activerecord-gaps"
cluster: connection-pool
deps: []
deps-rfc: []
est-loc: 20
priority: 12
pr: 2603
claim: "2026-06-05T02:01:41Z"
assignee: "pool-merge-resolve-url-config-unskip"
blocked-by: null
---

## Context

7 tests in `merge-and-resolve-default-url-config.test.ts` are already written but
skipped pending the full `ConnectionHandler` port (P9). Purely a blocker-removal
task once P9 lands.

## Acceptance criteria

- [ ] The 7 skipped tests unskipped and green once `ConnectionHandler` (P9) lands

## Notes

From the connection-pool gap plan (PF merge-resolve). Blocked on P9.
