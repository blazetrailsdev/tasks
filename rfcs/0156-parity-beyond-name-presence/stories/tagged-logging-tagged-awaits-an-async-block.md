---
title: "tagged-logging-tagged-awaits-an-async-block"
status: in-progress
updated: 2026-10-18
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 1
pr: trails#9039
claim: "2026-10-18T19:06:54Z"
assignee: "tagged-logging-tagged-awaits-an-async-block"
blocked-by: null
closed-reason: null
---

## Context

`TaggedLogging`'s `Formatter#tagged`
(`packages/activesupport/src/tagged-logging.ts:62-70`) pushes its tags, calls
the block, and pops the tags in a `finally`. For an async block the `finally`
runs as soon as the block returns its promise, before the work inside it
logs, so every line it writes is untagged. Rails' `tagged`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/tagged_logging.rb`) is
synchronous and keeps the tags for the whole block. The same shape was fixed
for `stubConst` by `stub-const-awaits-an-async-block` (trails#9017).

ActiveJob reaches it on every job: `perform_now` and `around_enqueue` both wrap
async work in `tag_logger`, which is `logger.tagged(*tags, &block)`
(`vendor/rails/v8.0.2/activejob/lib/active_job/logging.rb`). Surfaced by the
activejob codegen trial, where 7 `LoggingTest` cases (`uses active job as tag`,
`uses job name as tag`, `uses job id as tag`, ...) see untagged lines.

## Acceptance criteria

- When the block returns a thenable, `Formatter#tagged` (and so
  `TaggedLogger#tagged`) answers a promise that pops the tags after it settles,
  fulfilled or rejected. A synchronous block behaves exactly as today.
- A test logs from inside an awaited async block and sees the tags.
- Out of scope, noted: tags shared between concurrently running async blocks
  (Rails keeps them per thread/fiber through `IsolatedExecutionState`); that
  needs per-async-context tag storage and is its own story.
