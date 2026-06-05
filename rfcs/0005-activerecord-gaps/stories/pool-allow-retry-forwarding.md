---
title: "Forward allowRetry through concrete execQuery overrides"
status: blocked
updated: 2026-05-29
rfc: "0005-activerecord-gaps"
cluster: connection-pool
deps: []
deps-rfc: []
est-loc: 25
pr: null
claim: null
assignee: null
blocked-by: "Pool track wiring execute → withRawConnection must thread allowRetry first"
---

## Context

Widen the concrete adapter `execQuery` signatures (mysql2, postgresql) to accept
and read `allowRetry`, once the pool threads it through `execute →
withRawConnection`.

## Acceptance criteria

- [ ] `execQuery` overrides for mysql2 and postgresql accept + read `allowRetry`
- [ ] `allowRetry` honored on the concrete query path

## Notes

From the connection-pool gap plan (PF allow-retry). Blocked on the pool track
wiring `allowRetry` through `withRawConnection`.
