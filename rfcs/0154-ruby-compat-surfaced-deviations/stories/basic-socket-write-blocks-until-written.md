---
title: "BasicSocket#write blocks until written and raises once the peer has gone, as IO#write does"
status: draft
updated: 2026-10-27
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: fidelity
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#9384. `BasicSocket#write` (`packages/ruby-compat/src/socket.ts`) hands every buffer to the Node socket and returns its length at once. Ruby's `IO#write` (`vendor/ruby/v3.3.11/io.c:2263` `io_write_m`, through `io_binwrite` at `io.c:1858`) blocks until all of it has been written, and raises the `write(2)` errno once the peer has gone (`rb_sys_fail_on_write`).

So a caller of the blocking `write` gets no backpressure (the socket's queue grows without bound), and after the peer closes it gets no error.

## Converged shape

- The blocking form waits while the socket's write queue is at its high-water mark and resolves once it has drained, using the same signal `writeNonblock`/`waitWritable` use. Name the awaited form after the existing `readBlocking`, as `rbFLoad` is `Kernel#load`'s.
- After the peer has gone, `write` raises the socket's own error, or `Errno::EPIPE` after a clean close, as `writeNonblock` does since trails#9384.
- A `.trails.test.ts` case for each: waiting at the mark, and raising after the peer goes.
