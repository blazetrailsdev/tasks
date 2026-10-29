---
title: "ruby-compat-io-pipe"
status: draft
updated: 2026-10-29
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Listener#create_self_pipe` (`vendor/solid_cable/v3.0.7/lib/action_cable/subscription_adapter/solid_cable.rb:160-163`)
calls `IO.pipe` (`vendor/ruby/v3.3.11/io.c` `rb_io_s_pipe`). ruby-compat's `IO`
(`packages/ruby-compat/src/io.ts`) has no `pipe`. The reader needs `wait_readable(timeout)` and
`read_nonblock`, the writer `write_nonblock`, with `IO::EAGAINWaitReadable` on an empty pipe —
the same surface `BasicSocket` (`packages/ruby-compat/src/socket.ts`) already models over an
in-process buffer.

## Acceptance criteria

- `IO.pipe` answers `[reader, writer]` IO objects sharing one in-process byte buffer.
- `reader.waitReadable(timeout)`, `reader.readNonblock(len)` and `writer.writeNonblock(str)` follow
  MRI's arms (EAGAIN when empty, EOFError once the writer is closed).
- Covered by a ruby-compat test mirroring MRI's `test_io.rb` pipe cases that apply.
