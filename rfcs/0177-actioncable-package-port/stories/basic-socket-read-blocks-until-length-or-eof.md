---
title: "ruby-compat BasicSocket#read waits for length bytes or EOF"
status: draft
updated: 2026-10-22
rfc: "0177-actioncable-package-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`BasicSocket#read` (`packages/ruby-compat/src/socket.ts`, trails#9220) answers only the bytes that have already arrived, the way `read_nonblock` does. Ruby's `IO#read(length)` (`vendor/ruby/v3.3.11/io.c:3731` `io_read`) blocks until `length` bytes or EOF arrive. A Node socket cannot block a read, so the converged shape is an awaited read: wait (via `waitReadable`) until `length` bytes are buffered or EOF, then return them, so that a Ruby caller of a blocking `read` on a hijacked socket ports without a read loop.

## Acceptance criteria

- [ ] `read(length)` on a `BasicSocket` returns `length` bytes, or fewer only at EOF, waiting for more bytes as Ruby's `io_read` does. If a sync signature can't do that, add an awaited form and cite the `rbFLoad`-style precedent.
- [ ] Tests cover a read that spans two `data` events and a short read at EOF.
