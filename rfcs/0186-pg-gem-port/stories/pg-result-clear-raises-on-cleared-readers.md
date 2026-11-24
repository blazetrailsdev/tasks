---
title: "pg-result-clear-raises-on-cleared-readers"
status: done
updated: 2026-11-23
rfc: "0186-pg-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10675
claim: "2026-11-23T22:39:47Z"
assignee: "pg-close-prepared-sync-variants-and-pg17-gate"
blocked-by: null
closed-reason: null
---

# pg: a cleared PG::Result raises "result has been cleared"

## Context

`PG::Result#clear` nulls `pgresult` (`vendor/pg/v1.6.2/ext/pg_result.c:410-414`), and every reader then goes through `pgresult_get_this_safe`, which raises `PG::Error "result has been cleared"`. `packages/pg/lib/result.ts` `clear` only sets `_cleared` (read by `isCleared` / `inspect`), so `ntuples`, `values`, `getvalue` and the rest keep answering the old data.

## Acceptance criteria

- Readers that use `pgresult_get_this_safe` in `pg_result.c` raise `PG::Error "result has been cleared"` after `clear`.
- Port `result_spec.rb`'s clear examples that the engine can run.
