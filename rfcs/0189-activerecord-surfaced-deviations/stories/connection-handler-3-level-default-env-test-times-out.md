---
title: "ConnectionHandlerTest 3-level-config default env test times out at 5s in CI"
status: draft
updated: 2026-10-30
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

`packages/activerecord/src/connection-adapters/connection-handler.test.ts:184`
("establish connection using 3 level config defaults to default env primary db")
timed out at 5000ms in CI on trails#9480: Active Record PostgreSQL Tests (2),
run 41058495746, job 124072079367, twice on the same commit. The PR did not touch
activerecord. A rerun of the failed job then passed.

## Acceptance

- Find why the test can exceed 5s and fix the cause; do not just raise the timeout.
