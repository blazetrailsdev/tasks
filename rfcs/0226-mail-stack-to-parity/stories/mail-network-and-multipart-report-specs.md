---
title: "Port network_spec.rb and multipart_report_spec.rb"
status: ready
updated: 2026-11-10
rfc: "0226-mail-stack-to-parity"
cluster: null
packages:
  - "mail"
deps:
  - "mail-retriever-base-and-test-retriever"
deps-rfc: []
est-loc: 550
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`spec/mail/network_spec.rb` (35 tests: delivery-method selection, observers,
interceptors, `raise_delivery_errors`) and `spec/mail/multipart_report_spec.rb`
(21 tests: `multipart/report` bounce parsing over `spec/fixtures/emails/error_emails/`)
have no TS files. Observer / interceptor registration is on `Mail`
(`packages/mail/lib/mail.ts:104-140`). The spec also configures retrievers:
`retriever_method :pop3, …` in its `Mail.defaults` block (`network_spec.rb:22`),
"default delivery and retriever methods" (:30) and "should set the retriever
method" (:56). That is why it depends on the retriever-base story.

## Acceptance criteria

- [ ] `network.test.ts` and `multipart-report.test.ts` port every spec by name.
