---
title: "Port Mail::POP3 retriever and pop3_spec.rb over the spec's MockPOP3"
status: draft
updated: 2026-11-09
rfc: "0226-mail-stack-to-parity"
cluster: null
packages:
  - "mail"
deps:
  - "mail-retriever-base-and-test-retriever"
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/mail/2.8.1/lib/mail/network/retriever_methods/pop3.rb:1-143` (8 members)
is unported, and `spec/mail/network/retriever_methods/pop3_spec.rb` (21 tests)
with it. The spec drives `Net::POP3` through the `MockPOP3` double in
`vendor/mail/2.8.1/spec/spec_helper.rb`. trails has no `Net::POP3` port; this
RFC's Non-goals rule that the retriever resolves `Net::POP3` through a constant
the specs stub, and a real client is out of scope.

## Acceptance criteria

- [ ] `packages/mail/lib/network/retriever-methods/pop3.ts` ports the gem's body,
      naming `Net::POP3` the way the gem does, resolved at call time.
- [ ] `MockPOP3` is ported into `packages/mail/test/support/`.
- [ ] `pop3.test.ts` ports all 21 specs by name.
