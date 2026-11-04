---
title: "rackup: port Rackup::Stream"
status: done
updated: 2026-11-04
rfc: "0217-rackup-gem-port"
cluster: port
packages: ["rackup", "ruby-compat"]
deps: ["rackup-package-parity-enrollment"]
deps-rfc: []
est-loc: 350
priority: null
pr: trails#9695
claim: "2026-11-03T23:58:13Z"
assignee: "rackup-stream-port"
blocked-by: null
closed-reason: null
---

## Context

`Rackup::Stream` (rackup 2.2.1 `lib/rackup/stream.rb:8-198`) is the IO-like
object a handler hands a full hijack or a streaming body: `initialize(input,
output)` (`:9-19`), the `Reader` module (`read`, `read_partial`, `gets`,
`each`, `read_nonblock`, `:24-131`), `write` / `write_nonblock` / `<<` /
`flush` (`:134-152`), `close_read` / `close_write` / `close` / `closed?` /
`empty?` (`:154-188`), and the private `read_next` (`:190-196`). trails'
`Handler::Node` does not use it (Node hands a hijack the socket), so this
story does not depend on `rackup-handler-node-moves-out-of-rack`; it serves
applications and third-party handlers that build one. It has no
spec in the gem's `test/`. Binary reads answer `Uint8Array` per CLAUDE.md
§ "A String has no encoding tag either".

## Acceptance criteria

- [ ] `packages/rackup/src/stream.ts` ports every method above at its Rackup
      name, with `Reader` as a plain-object module `include`d into `Stream`.
- [ ] Tests in `stream.trails.test.ts` cover `read` with and without a
      length, `gets`, `each`, `close` with an error, and the
      `Non-writable output!` `ArgumentError`.
