---
title: "F-2 — connection-pool / multi-db campaign"
status: done
updated: 2026-06-07
rfc: "0000-ar-test-compare-100"
cluster: clusters
deps: []
deps-rfc: []
est-loc: 250
pr: 3009
claim: "2026-06-07T22:07:51Z"
assignee: "f2-connection-pool-campaign"
blocked-by: null
---

## Context

Batch 1 shipped #2883 (12 un-skips). 39 remaining. Next-batch candidates:
`connection-handler.test.ts` role-aliasing + `connectsTo` (4),
`registration.test.ts` (4), `unconnected.test.ts` (3),
`connection-management.test.ts` (2), `disconnected.test.ts` (1).

Permanent → H-3: `connection-pool.test.ts` thread/fiber (14), pool fork (5).
`standalone-connection.test.ts` (4) stays live.

## Acceptance criteria

- [ ] All non-permanent connection-pool skips un-skipped (batch by batch, each ≤500 LOC).
- [ ] Permanent thread/fiber/fork candidates reclassified in H-3.

## Notes

Verify every fork/pid/thread candidate against `unported-files.ts` before
reclassifying. Rails: `test/cases/connection_pool_test.rb`,
`connection_handling_test.rb`.
