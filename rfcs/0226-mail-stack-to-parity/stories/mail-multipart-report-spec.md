---
title: "mail-multipart-report-spec"
status: done
updated: 2026-11-15
rfc: "0226-mail-stack-to-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: trails#10139
claim: "2026-11-15T17:05:37Z"
assignee: "mail-multipart-report-spec"
blocked-by: null
closed-reason: null
---

## Context

Split from `mail-network-and-multipart-report-specs`, whose `network_spec.rb` half
landed as `packages/mail/test/network.test.ts`. `spec/mail/multipart_report_spec.rb`
(`vendor/mail/2.8.1/spec/mail/multipart_report_spec.rb`, 21 examples) still has no TS file.
It reads `spec/fixtures/emails/multipart_report_emails/` (5 `.eml` files, 665 lines:
`report_422.eml`, `report_530.eml`, `multipart_report_multiple_status.eml`,
`multi_address_bounce1.eml`, `multi_address_bounce2.eml`), which are not yet copied to
`packages/mail/test/fixtures/emails/`. The Message readers it drives are ported
(`packages/mail/lib/message.ts` `isMultipartReport`, `isDeliveryStatusReport`,
`deliveryStatusPart`, `isBounced`, `action`, `finalRecipient`, `errorStatus`,
`diagnosticCode`, `remoteMta`, `isRetryable`). `message.test.ts` globs
`fixtures/emails/**/*.eml`, so the copied fixtures also join its round-trip examples.

## Acceptance criteria

- [ ] The five fixtures are copied verbatim under `packages/mail/test/fixtures/emails/multipart_report_emails/`.
- [ ] `packages/mail/test/multipart-report.test.ts` ports all 21 examples by name, using `readFixture` / `readRawFixture` as `message.test.ts` does.
