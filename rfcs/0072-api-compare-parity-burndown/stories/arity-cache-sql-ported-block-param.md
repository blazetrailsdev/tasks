---
title: "arity: cache_sql's ported block param (execute) is the last unexcluded activerecord pair"
status: done
updated: 2026-07-30
rfc: "0072-api-compare-parity-burndown"
cluster: arity-fidelity
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 5633
claim: "2026-07-30T13:02:20Z"
assignee: "arity-cache-sql-ported-block-param"
blocked-by: null
closed-reason: null
---

## Context

Two arity mismatches remain in activerecord after
`arity-state-threading-triage` (PR #5340), both for the same ported method:

```text
connection_adapters/abstract_adapter.rb    cache_sql (sql, name, binds)
connection_adapters/abstract/query_cache.rb cache_sql (sql, name, binds)
  vs TS cacheSql (sql, name, binds, execute)
```

Rails' `cache_sql` takes a block and calls `yield` for the cache-miss path; the
trails port threads the miss path as an explicit fourth `execute` parameter.
`execute` is not in `TRAILING_CALLBACK_NAMES`
(`scripts/api-compare/arity.ts` — currently `fn`, `cb`, `callback`, `block`,
`blk`, `compute`), so the strip does not apply.

This was out of scope for the state-threading story (it is a ported-block case,
not state threading) and is the last unexcluded activerecord arity pair.

## Acceptance criteria

- Resolved one of two ways: rename the TS param to the conventional ported-block
  spelling (`block`) so the existing trailing-callback strip applies, or add a
  reasoned entry to `scripts/api-compare/arity-exclude.json`.
- Do NOT widen `TRAILING_CALLBACK_NAMES` with `execute` — it is a plausible
  genuine value arg elsewhere and would weaken the check repo-wide.
- `output/arity-mismatches.json` shows zero unexcluded activerecord entries.
