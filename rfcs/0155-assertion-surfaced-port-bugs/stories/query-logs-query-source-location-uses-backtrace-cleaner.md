---
title: "QueryLogs.querySourceLocation hand-parses the stack where Rails asks the backtrace cleaner"
status: claimed
updated: 2026-09-30
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-09-30T16:46:26Z"
assignee: "port-abstract-unit-controller-reopenings-and-rack-test-case"
blocked-by: null
closed-reason: null
---

## Context

`QueryLogs.query_source_location` (`vendor/rails/v8.0.2/activerecord/lib/active_record/query_logs.rb:156-162`) walks `Thread.each_caller_location` and returns the first frame `LogSubscriber.backtrace_cleaner.clean_frame(location)` keeps. trails' `QueryLogs.querySourceLocation` (`packages/activerecord/src/query-logs.ts`) instead splits `new Error().stack` and filters on hard-coded substrings (`node_modules`, `query-logs`, `activerecord/dist`), with no backtrace cleaner involved. Left as-is by trails#8213, which converged the rest of the module.

## Converged shape

`querySourceLocation` iterates caller frames and returns the first `LogSubscriber.backtraceCleaner.cleanFrame(frame)` result, else `null` — the same cleaner `LogSubscriber#query_source_location` uses.

## Acceptance criteria

- No hard-coded path substrings in `querySourceLocation`; frames are filtered by the backtrace cleaner.
- `pnpm parity:api:calls` shows `clean_frame` called.
