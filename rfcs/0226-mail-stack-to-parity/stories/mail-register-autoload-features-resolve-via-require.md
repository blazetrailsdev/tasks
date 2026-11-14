---
title: "Mail.register_autoload features resolve through Kernel.require"
status: draft
updated: 2026-11-14
rfc: "0226-mail-stack-to-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Mail.register_autoload` (`vendor/mail/2.8.1/lib/mail.rb:23-26`) passes a load-path feature (`'mail/network/delivery_methods/smtp'`). trails' `Mail.registerAutoload` (`packages/mail/lib/mail.ts`) records `./network/delivery-methods/smtp.js`, relative to `lib/`, through `rbAutoloadStr`. `rbAutoloadLoad` (`packages/ruby-compat/lib/variable.ts:451`) hands that string to `Kernel.require`. `rbFRequireFile` resolves a `./` feature against `Dir.pwd()`, so `rbAutoloadLoad(Mail, "SMTP")` would raise `LoadError` outside `packages/mail/lib`. Only `eagerAutoloadBang`'s `import()` resolves the path correctly today.

## Acceptance criteria

- [ ] Registered features resolve through `Kernel.require`, either by registering absolute paths or by adding `packages/mail/lib` to `$LOAD_PATH` with gem-style features (`mail/network/delivery_methods/smtp`).
- [ ] A test shows `rbAutoloadLoad(Mail, "SMTP")` returns without raising.
