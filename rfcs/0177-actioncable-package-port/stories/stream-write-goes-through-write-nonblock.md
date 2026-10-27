---
title: "Stream#write goes through write_nonblock and the event loop's pending writes, as Rails does"
status: in-progress
updated: 2026-10-27
rfc: "0177-actioncable-package-port"
cluster: fidelity
packages: ["actioncable"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#9384
claim: "2026-10-27T22:33:05Z"
assignee: "stream-write-goes-through-write-nonblock"
blocked-by: null
closed-reason: null
---

## Context

`ActionCable::Connection::Stream#write`
(`vendor/rails/v8.0.2/actioncable/lib/action_cable/connection/stream.rb:42-70`)
tries `@rack_hijack_io.write_nonblock(data, exception: false)` first. It keeps
the unwritten suffix of a short write as `@write_head`, queues anything it
can't write on `@write_buffer`, and calls
`@event_loop.writes_pending(@rack_hijack_io)`. The event loop then selects the
IO for writability and calls `#flush_write_buffer` (`stream.rb:72-90`) until
the buffer empties (`stream_event_loop.rb`).

trails' `packages/actioncable/src/connection/stream.ts:57-65` calls the
blocking `write` and ignores backpressure. The IO surface this needs,
`IO#write_nonblock` and `IO#wait_writable` on the hijacked `TCPSocket`, comes
from trails#9384. Nothing in trails models `writes_pending` or
`flush_write_buffer` yet.

## Acceptance

- `Stream#write` and `#flush_write_buffer` are ported with Rails' names, its
  `@write_lock`, `@write_head` and `@write_buffer`, and the `:wait_writable`,
  full-count and short-count branches.
- `StreamEventLoop#writes_pending` is ported, and a writable IO is flushed
  through `flush_write_buffer`.
- `EOFError` and `Errno::ECONNRESET` during a write call `client_gone`
  (`stream.rb:68-69`).
- Rails' `actioncable/test/connection/stream_test.rb` cases that cover writes
  are ported with their names verbatim, using `socketPair`, which backs up at
  its high-water mark since trails#9384.
