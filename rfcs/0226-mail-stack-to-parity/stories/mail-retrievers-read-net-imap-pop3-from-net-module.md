---
title: "mail retrievers read Net::IMAP / Net::POP3 off NetModule without casts"
status: draft
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

trails#10231 made ruby-compat's `Net` one declared type: `NetModule` in `packages/ruby-compat/lib/net/protocol.ts`, which a gem extends with `declare module "@blazetrails/ruby-compat" { interface NetModule { ... } }`. `packages/net-smtp/lib/protocol.ts` now does this. mail's retrievers still cast at every read: `(TopLevel.Net as NetWithIMAP).IMAP!` in `packages/mail/lib/network/retriever-methods/imap.ts:95,107,118,123,145,167` and `(TopLevel.Net as NetWithPOP3).POP3!` in `pop3.ts:128`. The test mocks seat through casts too (`packages/mail/test/support/mock-imap.ts:133`, `mock-pop3.ts:97`). Ruby reads plain `Net::IMAP` / `Net::POP3` (`vendor/mail/2.8.1/lib/mail/network/retriever_methods/imap.rb`, `pop3.rb`).

## Acceptance criteria

- [ ] `IMAP` and `POP3` are added to `NetModule` through a module augmentation (optional members, since the net-imap and net-pop gems are not ported).
- [ ] The `NetWithIMAP` / `NetWithPOP3` casts are deleted, and the call sites read `TopLevel.Net!.IMAP!` / `Net.IMAP!`.
