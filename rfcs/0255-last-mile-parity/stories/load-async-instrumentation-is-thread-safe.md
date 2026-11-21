---
title: 'activerecord: port "load async instrumentation is thread safe"'
status: in-progress
updated: 2026-11-21
rfc: "0255-last-mile-parity"
cluster: activerecord
packages: [activerecord]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#10507
claim: "2026-11-21T16:19:51Z"
assignee: "mysql2-adapter-calls-the-gem-not-the-npm-connection"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activerecord/test/cases/relation/load_async_test.rb:161-195`
subscribes to `sql.active_record` and runs `load_async` relations concurrently,
asserting each event carries its own payload. trails runs async loads on
ruby-compat `Thread`s.

## Acceptance criteria

- [ ] The test is ported as the Rails body and passes on all three adapters.
- [ ] If an event payload leaks across threads, fix `Instrumenter` / the async executor, not the test.

## Verification

```sh
pnpm vitest run packages/activerecord/test/cases/relation/load-async.test.ts
```
