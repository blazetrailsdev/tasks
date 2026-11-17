---
title: "net-smtp seats SMTP on ruby-compat's one Net module"
status: ready
updated: 2026-11-17
rfc: "0226-mail-stack-to-parity"
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

Ruby has one `Net` module. `vendor/ruby/v3.3.11/lib/net/protocol.rb:26` opens it, and `net/smtp.rb` reopens it to add `Net::SMTP` beside `Net::Protocol` and `Net::HTTP`. trails has two objects instead:

- `packages/ruby-compat/lib/net/protocol.ts` builds ruby-compat's `Net` and seats it with `constSet(TopLevel, "Net", Net)`.
- `packages/net-smtp/lib/protocol.ts` builds a second `Net = {}` object and assigns `TopLevel.Net = Net`. Whichever module loads last wins the `TopLevel` seat, so a `Net::SMTP` or `Net::HTTP` constant lookup depends on load order.

trails#10190 moved `Protocol` and the `Proto*` errors into ruby-compat, so net-smtp's object now only exists to carry `SMTP` and `SMTPAuthenticationError`.

## Acceptance criteria

- [ ] net-smtp seats `SMTP` and `SMTPAuthenticationError` on ruby-compat's `Net`, so `Net` has one declared type that includes the `SMTP` members. net-smtp's own `Net` object and its `TopLevel.Net` assignment are deleted.
- [ ] `constGet(TopLevel, "Net::SMTP")` and `"Net::HTTP"` both resolve regardless of import order.
