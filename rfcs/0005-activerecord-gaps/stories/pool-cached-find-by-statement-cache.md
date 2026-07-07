---
title: "Reconcile cachedFindBy with StatementCache and allowRetry"
status: done
updated: 2026-07-07
rfc: "0005-activerecord-gaps"
cluster: connection-pool
deps: ["pool-allow-retry-forwarding"]
deps-rfc: []
est-loc: 50
priority: 12
pr: 3235
claim: null
assignee: null
blocked-by: null
---

## Context

`cachedFindBy` bypasses `StatementCache` by going through `findBy`. Wire it to
actually use `StatementCache.execute`, then align the retry design with Rails.

## Acceptance criteria

- [ ] `cachedFindBy` uses `StatementCache.execute` (no `findBy` bypass)
- [ ] Retry design aligned with Rails once `allowRetry` is threaded
- [ ] Statement-cache tests cover the cached path

## Notes

From the connection-pool gap plan (PF cached-find-by). Depends on
[[pool-allow-retry-forwarding]].
