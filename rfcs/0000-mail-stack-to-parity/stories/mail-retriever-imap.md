---
title: "Port Mail::IMAP retriever and imap_spec.rb over the spec's MockIMAP"
status: draft
updated: 2026-11-09
rfc: "0000-mail-stack-to-parity"
cluster: null
packages:
  - "mail"
deps:
  - "mail-retriever-base-and-test-retriever"
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/mail/2.8.1/lib/mail/network/retriever_methods/imap.rb:1-187` (8 members)
is unported, with `spec/mail/network/retriever_methods/imap_spec.rb` (31 tests),
which uses `MockIMAP` from `vendor/mail/2.8.1/spec/spec_helper.rb`. Same
`Net::IMAP` resolution rule as the POP3 story.

## Acceptance criteria

- [ ] `packages/mail/lib/network/retriever-methods/imap.ts` ports the gem's body.
- [ ] `MockIMAP` is ported into `packages/mail/test/support/`.
- [ ] `imap.test.ts` ports all 31 specs by name.
