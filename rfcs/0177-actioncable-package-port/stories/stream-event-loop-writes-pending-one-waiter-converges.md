---
title: "StreamEventLoop#writes_pending converges to Rails' monitor-exists-only body"
status: in-progress
updated: 2026-10-29
rfc: "0177-actioncable-package-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#9429
claim: "2026-10-29T13:09:27Z"
assignee: "stream-event-loop-writes-pending-one-waiter-converges"
blocked-by: null
closed-reason: null
---

## Context

CLAUDE.md § "Node's event loop stands in for Action Cable's nio4r selector" says `writes_pending` and `Stream#flush_write_buffer` join the spawn/run/wakeup `SCOPED_SKIP_GROUPS` entry. trails#9384 ported `StreamEventLoop#writes_pending` anyway (`packages/actioncable/src/connection/stream-event-loop.ts`), and trails#9423 made `@map` hold `{ value, interests }` monitors. In that port, `writesPending` starts a writable waiter only when interests change from `"r"` to `"rw"` (the `selectingWritable` guard). That gives one flush per writable event, as Rails' single monitor and selector do (`vendor/rails/v8.0.2/actioncable/lib/action_cable/connection/stream_event_loop.rb:47-53,86-106`). Rails' body has no such branch. The repo owner allowed the guard on trails#9423.

## Acceptance criteria

- The CLAUDE.md section and the port agree. Either the section records the ported `writes_pending` and its one-waiter guard, or the port drops `writes_pending` / `flush_write_buffer` into the skip group, as the section says.
- If `writes_pending` stays, the guard converges toward Rails' body (`if monitor = @map[io]; monitor.interests = :rw; end`). For example, one writable waiter per monitor, started in `attach`, would leave `writesPending` with only the monitor-exists check.
- `stream-event-loop.trails.test.ts` stays green.
