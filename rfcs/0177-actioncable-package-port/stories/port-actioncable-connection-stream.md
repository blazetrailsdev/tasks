---
title: "Port Connection::Stream over the hijacked Node socket"
status: draft
updated: 2026-10-02
rfc: "0177-actioncable-package-port"
cluster: fidelity
packages: ["actioncable"]
deps: ["port-actioncable-connection-stream-event-loop"]
deps-rfc: []
est-loc: 300
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actioncable/lib/action_cable/connection/stream.rb` (117 lines), **Tier 2**. The file, its class name
and its callers stay. Its Rails test (`connection/stream_test.rb`) builds a
real `Connection::Base` and is ported in
`port-actioncable-connection-client-socket-and-stream-tests`.

- `initialize(event_loop, socket)` (`:12-22`): keeps the event loop and the
  socket object, and reads `socket.env["stream.send"]`.
- `each(&callback)` (`:24-26`): `@stream_send ||= callback`.
- `close` (`:28-31`): `shutdown`, then `@socket_object.client_gone`.
- `shutdown` (`:33-35`) → private `clean_rack_hijack` (`:110-114`):
  `@event_loop.detach(@rack_hijack_io, self)`, then nil the ivar.
- `write(data)` (`:37-70`): the `@stream_send` arm, then the
  `write_nonblock` state machine, with `rescue EOFError, Errno::ECONNRESET`
  calling `@socket_object.client_gone`.
- `flush_write_buffer` (`:72-92`).
- `receive(data)` (`:94-96`): `@socket_object.parse(data)`.
- `hijack_rack_socket` (`:98-107`).

Per the CLAUDE.md section from
`ratify-node-event-loop-stands-in-for-the-nio4r-selector`: `write` keeps its
`@stream_send` arm and its rescue and calls the socket's `write`, which
buffers the whole chunk. The `write_nonblock` result arms, `@write_lock`,
`@write_head` and `@write_buffer` are omitted, each with
`@missingRailsCall … — PERMANENT` at the call site. `flush_write_buffer` is
kept or skipped as that section decided.

## Rails files owned by this story

- `vendor/rails/v8.0.2/actioncable/lib/action_cable/connection/stream.rb`

## Fidelity traps (predicted at authoring)

- [ ] **`write` returns `data.bytesize`** on success. Bytes, not characters.
- [ ] **The rescue calls `client_gone` and nothing else**: no `on_error`. Rails' `connection/stream_test.rb` stubs the io's write to raise `EOFError` and `Errno::ECONNRESET` in turn and asserts `client_gone` was called and `errors` stayed empty. The raise must be catchable synchronously in `write`, so the test stubs the method this body calls.
- [ ] **Any other error propagates** to `ClientSocket#write`, whose rescue calls `emit_error`.
- [ ] **Node reports most write failures asynchronously**, on the socket's `error` event. The listener `StreamEventLoop#attach` registered turns that into `stream.close`, which is `shutdown` + `client_gone`: the same end state.
- [ ] **`hijack_rack_socket` returns early with no `rack.hijack`**, uses the call's return value, falls back to `env["rack.hijack_io"]`, then `attach`es.
- [ ] **`@stream_send` / `each`** is the `async.callback` path for servers without hijack (`client_socket.rb:63-65`). Keep both; they are public methods with a Rails caller.
- [ ] **`clean_rack_hijack` is idempotent** (`return unless @rack_hijack_io`); `close` and `shutdown` are both reached on a normal close.
- [ ] **`data` may be a String or bytes.** The driver's `io` emits `Buffer`s; a String handshake response from a draft-76 driver is binary.

## Acceptance criteria

- [ ] `stream.rb` reads complete in `parity:api` apart from whatever the CLAUDE.md section skipped; every omitted call is receipted `PERMANENT` against that section and nothing is baselined.
- [ ] A `.trails.test.ts` over a socket pair covers: `hijack_rack_socket` attaching; `write` reaching the peer and returning the byte size; an `EOFError` from the io's write calling `client_gone`; `shutdown` detaching and closing the io; `receive` reaching `parse`.

## Definition of done

A re-implemented write buffer on top of Node's, or a `write` with no rescue, does not close this story.

## Verification

```bash
pnpm vitest run packages/actioncable/src/connection/stream.trails.test.ts
API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api --package actioncable   # each owned file at 100%
pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm parity:api:params && pnpm parity:api:predicates && pnpm parity:api:extra:gate
pnpm lint
```
