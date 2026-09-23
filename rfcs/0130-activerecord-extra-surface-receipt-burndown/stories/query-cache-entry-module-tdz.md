---
title: "query-cache.ts as entry module hits QueryCacheMixin TDZ via abstract-adapter include"
status: draft
updated: 2026-09-23
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while verifying trails#7990. When the built module `packages/activerecord/dist/connection-adapters/abstract/query-cache.js` is the entry module in plain node, it throws:

```text
ReferenceError: Cannot access 'QueryCacheMixin' before initialization
    at dist/connection-adapters/abstract-adapter.js:1252  include(AbstractAdapter, QueryCacheMixin);
```

`abstract-adapter.ts:66-72` imports `QueryCache as QueryCacheMixin` from `./abstract/query-cache.js`. `query-cache.ts:10` imports `./connection-pool.js`, and that path reaches `abstract-adapter.ts` again, whose module-scope `include(AbstractAdapter, QueryCacheMixin)` runs while `query-cache.ts` has not finished evaluating. This predates #7990, which only added a leaf `base-slot.js` import to `query-cache.ts`.

Rails autoloads `ConnectionAdapters::QueryCache` (`abstract_adapter.rb` `include QueryCache`, `abstract/query_cache.rb`), so no order dependency exists there.

## Acceptance criteria

- Trace the cycle `query-cache.ts -> connection-pool.ts -> … -> abstract-adapter.ts` and break it with a plain import restructure if possible. Otherwise use a listed zero-import slot (CLAUDE.md § Call-time constant resolution).
- `node -e "import('./dist/connection-adapters/abstract/query-cache.js')"` loads cleanly, and `abstract-adapter.js` still does as an entry module.
