---
title: "Render local_level='s ArgumentError value with inspect, as Rails does"
status: done
updated: 2026-08-14
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: 6531
claim: "2026-08-14T17:15:04Z"
assignee: "call-args-tool-dispatched-identifier-in-argument-position"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of #6526.

`Logger`'s `local_level=` in `packages/activesupport/src/logger.ts` raises
`ArgumentError` with `Invalid log level: ${String(level)}`, where Rails
(`vendor/rails/activesupport/lib/active_support/logger_thread_safe_level.rb:21`)
renders the value through `inspect`:

```ruby
raise ArgumentError, "Invalid log level: #{level.inspect}"
```

`inspect` quotes a String (`"foo"`) and keeps a Symbol's leading colon
(`:foo`) — trails' `String()` renders both bare, so the message differs from
Rails for every value that reaches the branch.

trails has an `inspect` implementation to route this through; the converged
shape is to use it rather than `String()`. Low urgency: `LogLevel` is a closed
TS string union, so typed call sites cannot reach the else-branch — only an
untyped/`as never` caller can.

## Acceptance criteria

- The raise renders the offending value with trails' `inspect`, matching Rails'
  message byte-for-byte for a String and a Symbol input.
- The existing `LoggerThreadSafeLevel > raises on an unknown level` cover in
  `logger.trails.test.ts` is updated to assert the inspected form.
