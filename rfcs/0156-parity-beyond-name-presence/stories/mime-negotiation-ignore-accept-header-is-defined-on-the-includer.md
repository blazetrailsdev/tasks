---
title: "mime-negotiation-ignore-accept-header-is-defined-on-the-includer"
status: closed
updated: 2026-10-11
rfc: "0156-parity-beyond-name-presence"
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
closed-reason: "FALSIFIED: converged in trails#8795 in the review round after it was filed"
---

## Context

`ActionDispatch::Http::MimeNegotiation` declares its accessor in an `included` block:
`included do mattr_accessor :ignore_accept_header, default: false end`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/mime_negotiation.rb:19-21`), so the
accessor is defined on the includer, `ActionDispatch::Request`, and `use_accept_header` reads
`!self.class.ignore_accept_header` (`mime_negotiation.rb:176`).

trails declares it with `mattrAccessor.call(this, "ignoreAcceptHeader", { default: false })` in
a static block of a `MimeNegotiation` class
(`packages/actionpack/src/action-dispatch/http/mime-negotiation.ts`), `Request` forwards to it
with a hand-written `static get ignoreAcceptHeader` / `static set ignoreAcceptHeader` pair
(`packages/actionpack/src/action-dispatch/http/request.ts`), and `useAcceptHeader` reads
`MimeNegotiation.ignoreAcceptHeader` rather than the receiver's class.

## Acceptance criteria

- `ignore_accept_header` is defined on `Request` by `MimeNegotiation`'s `included` callback
  (`include()` / the `included` symbol), not on a `MimeNegotiation` class.
- The forwarding accessor pair in `request.ts` is deleted.
- `useAcceptHeader` reads the receiver's class, as `mime_negotiation.rb:176` does.
