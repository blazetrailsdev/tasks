---
title: "Port Mail's retriever_method surface, Retriever base and TestRetriever"
status: ready
updated: 2026-11-10
rfc: "0226-mail-stack-to-parity"
cluster: null
packages:
  - "mail"
deps: []
deps-rfc: []
est-loc: 450
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Retrieval is unported. Missing rows: `network/retriever_methods/base.rb` 0/4
(`first`, `last`, `all`, `find_and_delete`), `test_retriever.rb` 0/4,
`configuration.rb` 3/6 (`initialize`, `retriever_method`,
`lookup_retriever_method`, `vendor/mail/2.8.1/lib/mail/configuration.rb:16-78`),
and the module functions `Mail.retriever_method`, `find`, `find_and_delete`,
`first`, `last`, `all`, `delete_all`, `connection`
(`vendor/mail/2.8.1/lib/mail/mail.rb:110-170`).
Specs: `spec/mail/network/retriever_methods/test_retriever_spec.rb` (11) and
`spec/mail/configuration_spec.rb` (7) are unported. `Configuration` including
`Singleton` is owned by `enumerator-map-and-singleton-for-mail`; this story
does not re-port it.

## Acceptance criteria

- [ ] `packages/mail/lib/network/retriever-methods/base.ts` and `test-retriever.ts`
      port the gem bodies; `Configuration#retrieverMethod` /
      `lookupRetrieverMethod` resolve `:pop3`, `:imap`, `:test` as the gem does.
- [ ] The `Mail.*` retrieval module functions are ported on `Mail`.
- [ ] `test-retriever.test.ts` and `configuration.test.ts` port their specs by name.
