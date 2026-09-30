---
title: "activerecord: enroll load_async_test.rb and asynchronous_queries_test.rb (source now ported)"
status: ready
updated: 2026-09-30
rfc: "0175-activerecord-test-parity-100"
cluster: unported-tests
packages: ["activerecord"]
deps: ["audit-load-async-surface-portability", "activerecord-port-promise"]
deps-rfc: []
est-loc: 550
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The register still excludes async-query tests whose own reasons say "SOURCE NOW PORTED":

- `relation/load_async_test.rb` — "scheduled?"; "null scheduled?"; "reset"; "load async has many association"; "load async has many through association"; "load async instrumentation is thread safe"; "simple query"; "load async from transaction" …
  reason: SOURCE NOW PORTED (future_result.rb — story call-args-ar-select-all-empty-async-row); this is a test-only entry, narrowed from the whole file by story enroll-load-async-notification-forwarding, which ported `test_notific
- `asynchronous_queries_test.rb` — (whole file)
  reason: SOURCE NOW PORTED (asynchronous_queries_tracker.rb — story call-args-ar-select-all-empty-async-row); this is a test-only entry. The tests assert Concurrent::ThreadPoolExecutor sizing (min/max threads, max queue) and cros
- `connection_adapters/standalone_connection_test.rb` — "async fallback"
  reason: select_all(async: true) returns a FutureResult::Complete from the thread-backed load_async infrastructure, which is excluded (see the future_result.rb entry).

`audit-load-async-surface-portability` (RFC 0023) splits the whole-file exclusion; `ActiveRecord::Promise`
(`activerecord-port-promise`, RFC 0174) is the return type these tests assert.

## Acceptance criteria

- [ ] Every portable case is enrolled with Rails' body; `FutureResult`/`Promise` assertions ported; entries deleted.
- [ ] Cases asserting a background thread pool's scheduling use `withExecutionContext` like the Thread stories.

## Verification

```bash
pnpm parity:test --package activerecord --missing && pnpm vitest run scripts/parity/unported-files.test.ts scripts/parity/unported-live-test.test.ts
```
