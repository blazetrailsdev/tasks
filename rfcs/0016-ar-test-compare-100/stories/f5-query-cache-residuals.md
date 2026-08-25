---
title: "F-5 — query-cache residuals"
status: done
updated: 2026-06-10
rfc: "0016-ar-test-compare-100"
cluster: clusters
deps: ["f7-fixtures-backed-clusters"]
deps-rfc: []
est-loc: 50
pr: 3082
claim: "2026-06-10T13:29:37Z"
assignee: "f5-query-cache-residuals"
blocked-by: null
---

## Context

5 actionable skips; 4 permanent thread/fork cases go to H-3. The habtm-dependent
skips (`:848,853`) need Post⇔Category canonical fixtures (dep: F-7).

- `:848,853` — `cache is expired by habtm update/delete` (needs HABTM setup).
- `:540` — `query cached even when types are reset` (`resetColumnInformation` path).
- `:492` — `cache is ignored for locked relations`.

## Acceptance criteria

- [ ] `:492` and `:540` un-skipped (no F-7 dep).
- [ ] `:848,853` un-skipped after F-7 lands.
- [ ] Permanent thread/fork (4) reclassified to H-3.

## Notes

Rails: `test/cases/query_cache_test.rb`;
`lib/active_record/connection_adapters/abstract/query_cache.rb`.
