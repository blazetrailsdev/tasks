---
title: "Port network_spec.rb and multipart_report_spec.rb"
status: draft
updated: 2026-11-09
rfc: "0000-mail-stack-to-parity"
cluster: null
packages:
  - "mail"
deps:
  - "mail-retriever-base-and-test-retriever"
deps-rfc: []
est-loc: 550
priority: null
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
(`packages/mail/lib/mail.ts:104-140`).

## Acceptance criteria

- [ ] `network.test.ts` and `multipart-report.test.ts` port every spec by name.
