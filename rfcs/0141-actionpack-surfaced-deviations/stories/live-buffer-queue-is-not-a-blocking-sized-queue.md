---
title: "Live::Buffer's queue is a plain array: no SizedQueue, monitor or condition variable"
status: done
updated: 2026-09-29
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8238
claim: "2026-09-28T23:32:29Z"
assignee: "live-buffer-queue-is-not-a-blocking-sized-queue"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in trails#8165. `ActionController::Live::Buffer` (`action_controller/metal/live.rb:151-257`) `include MonitorMixin`, and in Rails:

- `close` is `synchronize do super; @buf.push nil; @cv.broadcast end`;
- `abort` is `synchronize do @aborted = true; @buf.clear end`;
- `initialize` builds `@cv = new_cond`;
- `undef_method :to_ary`;
- `build_queue` returns a `SizedQueue` / `Queue`, and `each_chunk` pops it under `permit_concurrent_loads`, blocking.

trails' `Buffer` (`packages/actionpack/src/action-controller/metal/live.ts`) now extends `ResponseBuffer` (#8165), but it has no monitor and no condition variable. `buildQueue` returns a plain array, so `eachChunk` drains whatever is present and stops, rather than waiting for the producer. A live stream whose writer is async can therefore be read short.

## Acceptance criteria

- `buildQueue` returns an async-capable queue honouring `queueSize`, and `eachChunk` awaits the next chunk until the `null` sentinel (the async-iterable counterpart of `SizedQueue#pop`).
- `close` / `abort` run under ruby-compat's `synchronize`, as `live.rb` does, if their bodies gain an await (see CLAUDE.md § the pool monitor).
- `Live::Buffer` does not answer `toAry` (`live.rb:179`).
