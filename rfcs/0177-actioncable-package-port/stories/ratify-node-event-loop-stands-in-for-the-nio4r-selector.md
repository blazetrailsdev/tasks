---
title: "CLAUDE.md: Node's event loop stands in for Action Cable's nio4r selector loop"
status: draft
updated: 2026-10-01
rfc: "0177-actioncable-package-port"
cluster: fidelity
packages: ["actioncable"]
deps: []
deps-rfc: []
est-loc: 120
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Docs-only, in the trails repo. It lands before any socket story so their
call-site receipts have a section to cite. Precedents: CLAUDE.md § "The pool
monitor guards only sections that span an `await`" and § "Trails has no
autoloader".

**What Rails does.** `Connection::StreamEventLoop`
(`vendor/rails/v8.0.2/actioncable/lib/action_cable/connection/stream_event_loop.rb`) owns an `NIO::Selector` and one
thread running `run` (`:86-133`): it drains a todo queue, `select`s, reads
up to 4096 bytes from each readable socket with `read_nonblock` and hands them
to `stream.receive`, and calls `stream.flush_write_buffer` for each writable
one. `spawn` (`:62-80`) starts that thread and `wakeup` (`:82-84`)
interrupts the `select`. `Connection::Stream#write` (`connection/stream.rb:37-70`)
calls `write_nonblock` and keeps the unwritten tail in `@write_head` /
`@write_buffer` for the loop to flush (`:72-92`).

**What Node does.** A `net.Socket` is already registered with the process's
event loop. It emits `data` when readable and buffers every `write` in full,
so there is never a partial write to carry. There is no selector to own, no
loop thread to spawn and nothing to wake.

**The section states:**

- Node's event loop stands in for the `NIO::Selector` and its thread. The
  private `spawn`, `run` and `wakeup` are not ported and are recorded in
  `SCOPED_SKIP_GROUPS` with that reason.
- `attach` and `detach` keep their names and callers. `attach(io, stream)`
  registers the socket's `data` / `end` / `error` listeners, holding them
  in `@map` where Rails holds the NIO monitor; they call `stream.receive`
  and `stream.close` exactly where `run` does (`:111-129`). `detach`
  removes them, deletes the map entry and closes the socket (`:38-45`).
- `timer`, `post` and `stop` are ordinary ports over ruby-compat's
  `TimerTask` and `ThreadPoolExecutor`.
- `Stream#write` calls the socket's `write` and keeps its `@stream_send`
  arm and its `rescue EOFError, Errno::ECONNRESET`. Its `write_nonblock`
  result arms, `@write_lock`, `@write_head` and `@write_buffer` have no
  counterpart.
- **Decide here** whether `StreamEventLoop#writes_pending` and
  `Stream#flush_write_buffer` keep a body (RFC Open question 5). Their only
  callers are `Stream#write`'s partial-write arms (`stream.rb:54,65`) and
  `run` (`stream_event_loop.rb:105`). Recommendation: they join the skip
  group, because a method no trails code can call is an empty stub.
- `Connection::ClientSocket` drives the npm `websocket-driver`, built with
  `Driver.http` from a request-shaped object read off the Rack env where Rails
  calls `WebSocket::Driver.rack(self, …)`; the driver's `io` stream's
  `data` event calls `ClientSocket#write`, where the Ruby driver calls
  `socket.write`.
- `Server::Worker` is **not** covered: it ports line for line over
  ruby-compat's `ThreadPoolExecutor`.
- Scope: the files named above only. It is not a receipt for dropping a
  `synchronize` elsewhere; § "The pool monitor guards only sections that span
  an `await`" still decides those.

- `Connection::WebSocket` is Tier 1 except for one argument:
  `::WebSocket::Driver.websocket?(env)` (`connection/web_socket.rb:14`)
  is `Driver.isWebSocket` on the same request-shaped object.

The section also names the files it covers so a grep finds every citation:
`connection/stream-event-loop.ts`, `connection/stream.ts`,
`connection/client-socket.ts`, and `connection/web-socket.ts` for that
one call.

## Fidelity traps (predicted at authoring)

- [ ] **Do not ratify more than is unportable.** Every method listed as kept must have a trails caller; every method listed as skipped must have none.
- [ ] **`vendor/` citations are versioned.** `scripts/vendor-citations.test.ts` runs on docs-only PRs.

## Acceptance criteria

- [ ] CLAUDE.md has the section, with versioned `vendor/rails/v8.0.2/actioncable/...` citations and the list of files it covers.
- [ ] The section answers RFC Open question 5 for `writes_pending` and `flush_write_buffer`.
- [ ] `scripts/vendor-citations.test.ts` passes.

## Definition of done

A section that blesses dropping `Server::Worker`'s executor, or one with no file list, does not close this story.

## Verification

```bash
pnpm vitest run scripts/vendor-citations.test.ts
grep -n 'nio4r' CLAUDE.md   # the section, its file list, and the Open question 5 answer
```
