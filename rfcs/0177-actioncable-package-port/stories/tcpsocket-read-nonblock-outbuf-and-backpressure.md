---
title: "ruby-compat TCPSocket: read_nonblock, outbuf and backpressure"
status: draft
updated: 2026-10-22
rfc: "0177-actioncable-package-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9215 added `BasicSocket` / `TCPSocket` (`packages/ruby-compat/src/socket.ts`) over the adapter's `HttpSocket`. Its `read` returns only the bytes that have already arrived, the way `read_nonblock` does. Ruby's `IO#read` (`vendor/ruby/v3.3.11/io.c:3731` `io_read`) blocks until `length` bytes or EOF arrive. The port's `read` also ignores the `outbuf` argument, where `io_read` replaces and resizes it. It buffers incoming `data` events with no limit, because `HttpSocket` (`packages/ruby-compat/src/http-adapter.ts:20-29`) has no `pause` / `resume`.

Action Cable's `StreamEventLoop` reads with `io.read_nonblock(4096, exception: false)` (`vendor/rails/v8.0.2/actioncable/lib/action_cable/connection/stream_event_loop.rb`). This story should make sure the TS socket answers that call at its Ruby name, and that a blocking `read` and the outbuf exist where callers need them.

## Acceptance criteria

- [ ] `TCPSocket#read_nonblock(maxlen, exception: false)` is ported at its Ruby name (`readNonblock`). With no data it answers `:wait_readable`, and at EOF it answers `nil`, per `io.c` `io_read_nonblock`.
- [ ] `read`'s outbuf arm replaces the buffer, as in `io_read`, or the parameter is removed from the override.
- [ ] `HttpSocket` gains `pause` / `resume`, and the socket applies backpressure above a high-water mark.
- [ ] Tests cover each of these.
