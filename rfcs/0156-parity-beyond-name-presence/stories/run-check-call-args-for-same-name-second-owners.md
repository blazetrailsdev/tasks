---
title: "run-check-call-args-for-same-name-second-owners"
status: draft
updated: 2026-11-11
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split from `converge-same-name-second-owner-call-rows`, whose call-SET rows
are converged or per-row reasoned. Its second acceptance criterion is still
open. In `scripts/api-compare/compare.ts`, the direct-match arm's loop over
further same-level Ruby owners (`for (const other of rubyOwnersByName.get(rubyName) ...)`)
calls `checkCalls` and `checkOptionKeys` but not `checkCallArgs`. Adding
`checkCallArgs(rubyName, directMatch, expectedTs, other, otherLevel);` next to
`checkCalls` (measured 2026-11-11) surfaces:

**36 naming rows** (AR closure / NAMING_ENROLLED_PACKAGES, cannot be baselined):

```text
activerecord  connection-adapters/abstract/query-cache.ts  queryCache  new  (queryCacheVersion, queryCacheMaxSize)
activerecord  connection-adapters/abstract/transaction.ts  beforeCommit/afterCommit/afterRollback  new  (block)
activerecord  connection-adapters/schema-cache.ts  17 rows: BoundSchemaReflection `@pool` vs `this._pool`; SchemaCache `@primary_keys`/`@columns`/`@columns_hash`/`@indexes`/`@data_sources` vs `this._x`
activerecord  statement-cache.ts  bind  each_with_index  (indexes)
activerecord  store.ts  prepare  as_indifferent_hash  (attribute)
activerecord  type/adapter-specific-registry.ts  call  keys  (options)
activesupport  notifications/fanout.ts  start/finish  (name, id, payload)
activesupport  notifications/instrumenter.ts  buildHandle  new  (notifier)
actioncontroller  metal/request-forgery-protection.ts  reset  delete  (cookieName)
rack  response.ts  doNotCacheBang/cacheBang  set_header  (httpdate)
```

**12 shape rows**: actioncable `subscription-adapter/redis.ts` initialize;
actiondispatch `middleware/cookies.ts` initialize (5: `new`/`rotate` kwargs);
actionview `template/error.ts` initialize `join()`; activemodel `attribute.ts`
`_value_for_database` `serialize`; activesupport `core-ext/object/json.ts`
`as_json` (`formatted_offset(false)`, `instance_values()`); rack `request.ts`
`trusted_proxy?` `ip_filter()`; trailties `source-annotation-extractor.ts`
`annotations` `readlines`.

## Acceptance criteria

- `checkCallArgs` runs for the extra owners in the direct-match arm of `compare.ts`.
- Each naming row is renamed to the Rails identifier (camelCased) or carries a
  `@missingRailsName ... — PERMANENT` receipt only where no rename can close it.
- Each shape row is converged; a baseline row only with a reviewed per-row reason
  citing the Rails `file:line`.
- `pnpm parity:api:calls:args` green.
