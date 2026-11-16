---
title: "net-protocol-single-protocol-class-in-ruby-compat"
status: draft
updated: 2026-11-16
rfc: "0226-mail-stack-to-parity"
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

`Net::Protocol` (`vendor/net-protocol/v0.2.2/lib/net/protocol.rb:28-57`) is the superclass of both `Net::HTTP` and `Net::SMTP`. trails#10170 ported it into `packages/net-smtp/lib/protocol.ts` as `Protocol`, and `SMTP extends Protocol`. `packages/ruby-compat/lib/net/protocol.ts` mirrors the same Ruby file. It has its own copies of `ProtocolError`, `OpenTimeout` and the other `Proto*` errors, but no `Protocol` class. `Net::HTTP` (`packages/ruby-compat/lib/net/http.ts:60`) does not extend one, and it keeps a private `sslSocketConnect` (`:528`, `@noRailsEquivalent PERMANENT`) with the same `if timeout` / `timeout <= 0` branches.

## Acceptance criteria

- [ ] One `Net::Protocol` class in ruby-compat's `net/protocol.ts`, with `sslSocketConnect` at protocol.rb:40-56 calling `s.connect`.
- [ ] `HTTP extends Protocol` and `SMTP extends Protocol`. HTTP's private `sslSocketConnect` is removed.
- [ ] net-smtp's duplicate error classes are re-exported from ruby-compat.
