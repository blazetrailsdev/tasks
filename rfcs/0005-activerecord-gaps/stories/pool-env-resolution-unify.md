---
title: "Unify fromEnv currentEnv vs forCurrentEnv defaultEnv resolution"
status: ready
rfc: "0005-activerecord-gaps"
cluster: connection-pool
deps: []
deps-rfc: []
est-loc: 40
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`fromEnv()`'s `currentEnv` (build-time guard) and `forCurrentEnv`'s `defaultEnv`
(`DatabaseConfigurations.defaultEnv`) disagree when `TRAILS_ENV != defaultEnv`.

## Acceptance criteria

- [ ] `fromEnv()` and `forCurrentEnv` resolve the same env when
      `TRAILS_ENV != defaultEnv`
- [ ] Test covering the divergent case

## Notes

From the connection-pool gap plan (PF env-resolution), ready, low priority.
