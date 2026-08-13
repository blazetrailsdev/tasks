---
title: "call-args-as-notifications-callable-object"
status: done
updated: 2026-08-13
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6486
claim: "2026-08-13T18:45:40Z"
assignee: "call-args-as-notifications-callable-object"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the RFC 0099 `call-args-ar-literal-values` PR.
`activerecord/lib/active_record/testing/query_assertions.rb:22` and `:47` write
`ActiveSupport::Notifications.subscribed(counter, "sql.active_record") do … end`
— they pass the `SQLCounter` OBJECT, because Rails' Fanout accepts any
subscriber responding to `call` (`activesupport/lib/active_support/notifications.rb`,
`notifications/fanout.rb#Subscribers.new`).

trails' `Notifications.subscribed` / `subscribe` / `monotonicSubscribe`
(`packages/activesupport/src/notifications.ts:36`, `:102`, `:128`) accept a
FUNCTION only, so the port at
`packages/activerecord/src/testing/query-assertions.ts:67` and `:113` wraps the
counter in an arrow that forwards to `counter.call(...)`. The comparator flags
`subscribed(ref:counter, str:sql.active_record)` vs
`(str:sql.active_record, ref:fn)`; baselined in
`scripts/api-compare/call-mismatches-exclude/activerecord/testing/query-assertions.json`
with that reason.

Note the overload dispatch in `subscribe`/`subscribed`/`monotonicSubscribe`
keys off `typeof patternOrCallback === "function"`, so admitting an object
subscriber needs that branch reworked, not just the type widened.

## Acceptance criteria

1. `NotificationCallback` admits an object with a `call` method, as Rails'
   Fanout does, and the pattern-vs-callback overload dispatch handles it.
2. `query-assertions.ts:67` and `:113` pass `counter` directly, matching
   `query_assertions.rb:22` / `:47`.
3. The two baseline rows go stale and are deleted by hand (only-shrink).
4. `pnpm parity:api:calls:args` green, row count strictly decreases.
