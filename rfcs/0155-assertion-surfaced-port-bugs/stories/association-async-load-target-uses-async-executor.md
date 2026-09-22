---
title: "association-async-load-target-uses-async-executor"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
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

Parked (converged body intact, `it.skip` + `BLOCKED: association-async-load-target-uses-async-executor`):

- `packages/activerecord/src/associations/belongs-to-associations.test.ts` — `async load belongs to`
  (Rails `activerecord/test/cases/associations/belongs_to_associations_test.rb:1850-1872`)
- `packages/activerecord/src/associations/has-one-associations.test.ts` — `async load has one`
  (Rails `activerecord/test/cases/associations/has_one_associations_test.rb:979-1001`)

Rails calls `association.async_load_target`, then `wait_for_async_query`, then
subscribes to `sql.active_record` around the reader and asserts
`events.size == 1` and `events.first.payload[:async] == true` — i.e. the load
was scheduled on the async executor and its (already-run) event is published
when the reader first consumes the `FutureResult`.

trails' `Association#asyncLoadTarget` (`packages/activerecord/src/associations/association.ts:296`)
just awaits `loadTarget()` and sets `_loadedViaAsync`. No query is scheduled
through the async executor, so no `async: true` event is published when the
reader is read afterwards (the reader reads the already-loaded target and emits
no event at all → `events.length` is 0). Also no `waitForAsyncQuery` test
helper exists (Rails `activerecord/test/cases/test_case.rb` `wait_for_async_query`);
the parked bodies omit that call.

Rails: `association.rb` `async_load_target` → `find_target(async: true)`;
`Relation#load_async` / `FutureResult`.

Not investigated beyond reading `asyncLoadTarget`.

## Acceptance criteria

- `Association#asyncLoadTarget` mirrors Rails' `async_load_target` (find_target with async), publishing an `async: true` `sql.active_record` event when consumed.
- A `waitForAsyncQuery` test helper mirrors Rails' `wait_for_async_query`, and the parked bodies call it.
- Both parked tests un-skipped (keep the `unless in_memory_db?` gate as `it.skipIf(inMemoryDb())`) and green.
