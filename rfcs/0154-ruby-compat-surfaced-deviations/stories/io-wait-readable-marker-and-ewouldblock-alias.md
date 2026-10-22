---
title: "ruby-compat: IO::WaitReadable marker on EAGAINWaitReadable, EWOULDBLOCK aliases"
status: draft
updated: 2026-10-22
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9220 added `IO::EAGAINWaitReadable` (`packages/ruby-compat/src/io.ts`) as a subclass of `Errno::EAGAIN`, raised by `BasicSocket#readNonblock` (`packages/ruby-compat/src/socket.ts`). Ruby also includes the `IO::WaitReadable` marker module into it (`vendor/ruby/v3.3.11/io.c:15389-15390`, `rb_include_module(rb_eEAGAINWaitReadable, rb_mWaitReadable)`), and aliases `IO::EWOULDBLOCKWaitReadable` to the same class (`io.c:15395`). Neither is ported, so `rescue IO::WaitReadable`, the usual idiom around `read_nonblock`, has no `instanceof` target.

## Acceptance criteria

- [ ] `IO.WaitReadable` exists, and `error instanceof IO.WaitReadable` is true for an `IO.EAGAINWaitReadable`.
- [ ] `IO.EWOULDBLOCKWaitReadable === IO.EAGAINWaitReadable`, and `Errno.EWOULDBLOCK === Errno.EAGAIN`, as on Linux.
- [ ] Tests cover both.
