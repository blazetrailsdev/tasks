---
title: "Port FutureResult::EventBuffer so async queries carry lock_wait"
status: done
updated: 2026-08-16
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6585
claim: "2026-08-15T23:28:17Z"
assignee: "extract-call-template-build"
blocked-by: null
closed-reason: null
---

## Context

PR #6515 ported `ActiveRecord::FutureResult`
(`vendor/rails/activerecord/lib/active_record/future_result.rb`) but deliberately
omitted its nested `EventBuffer` class (`future_result.rb:24-47`). Two call-set
baseline rows record the omission, both on
`scripts/api-compare/call-mismatches-exclude/activerecord/future-result.json`:

- `execute_or_skip` → `new` (`future_result.rb:104`, `EventBuffer.new(self, @instrumenter)`)
- `result` → `flush` (`future_result.rb:117`, `@event_buffer&.flush`)

The stated reason is that `EventBuffer` exists to carry instrumentation events
across a thread boundary, and a single-threaded event loop has none. That is true
of the _buffering_, but it is not the whole of what `EventBuffer` does, and the
remainder IS observable in JS:

```ruby
def flush
  events, @events = @events, []
  events.each do |event|
    event.payload[:lock_wait] = @future_result.lock_wait   # future_result.rb:43
    ActiveSupport::Notifications.publish_event(event)
  end
end
```

Rails enriches every async query's `sql.active_record` payload with
`lock_wait` — how long the foreground thread waited on the mutex. trails'
`FutureResult` computes and stores `lockWait`
(`packages/activerecord/src/future-result.ts`, `executeOrWait`, mirroring
`future_result.rb:142-156`) but nothing ever reads it: no instrumentation payload
in the repo carries a `lock_wait` key. Subscribers that key off it — which is the
only way to tell a contended async query from an uncontended one — see nothing.

Rails also swaps the instrumenter for the duration of the scheduled query
(`ActiveSupport::IsolatedExecutionState[:active_record_instrumenter] = @event_buffer`,
`future_result.rb:106`), so events emitted by the query land in the buffer rather
than going straight out. trails has `IsolatedExecutionState`
(`packages/activesupport/src/isolated-execution-state.ts`), so that redirection is
portable even though the threading motivation is not.

## Converged shape

`EventBuffer` ported with Rails' three methods (`initialize`, `instrument`,
`flush`), constructed in `executeOrSkip` and flushed in `result`, so a scheduled
FutureResult's query events carry `lock_wait` exactly as Rails' do. If the
buffering itself is genuinely inert on one thread, the minimum convergence is that
`lock_wait` reaches the `sql.active_record` payload and the two baseline rows are
deleted — a story that closes by widening the reason is not a convergence (CLAUDE.md).

## Acceptance criteria

1. `FutureResult::EventBuffer` is ported at the Rails name with `instrument` and
   `flush` (`future_result.rb:24-47`), or `lock_wait` reaches the instrumentation
   payload by whatever shape survives the single-thread collapse.
2. A scheduled FutureResult's `sql.active_record` event carries `lock_wait`, with a
   test asserting a contended read reports a non-zero value and an uncontended one
   reports `0.0` (`future_result.rb:43,146-156`).
3. Both baseline rows (`execute_or_skip` → `new`, `result` → `flush`) are deleted
   from `call-mismatches-exclude/activerecord/future-result.json` (only-shrink, no
   `--write`), and the unreviewed mark shard is tightened.
