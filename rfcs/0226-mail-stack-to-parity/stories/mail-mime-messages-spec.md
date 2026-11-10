---
title: "mail-mime-messages-spec"
status: closed
updated: 2026-11-10
rfc: "0226-mail-stack-to-parity"
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
closed-reason: "FALSIFIED: duplicate of mail-mime-messages-and-example-emails-specs, which stays open for mime_messages_spec.rb"
---

# Port mime_messages_spec.rb

## Context

`vendor/mail/2.8.1/spec/mail/mime_messages_spec.rb` (615 lines, 67 tests) has
no TS file. It was bundled with `example_emails_spec.rb` in
`mail-mime-messages-and-example-emails-specs`, which ported only the latter to
fit the PR ceiling. Fixtures it reads: `attachments/test.{jpg,pdf,png,zip}`,
`attachments/てすと.txt` (trails has `tesuto.txt`), and
`emails/attachment_emails/{attachment_content_disposition,attachment_only_email,attachment_pdf}.eml`,
`emails/mime_emails/{email_with_similar_boundaries,raw_email11,raw_email7,raw_email_with_nested_attachment}.eml`,
`emails/plain_emails/basic_email.eml`; copy the missing ones verbatim from
`vendor/mail/2.8.1/spec/fixtures/` to `packages/mail/test/fixtures/`.
`packages/mail/test/example-emails.test.ts` shows the `readFixture` /
`toEqualRuby` shape.

## Acceptance criteria

- [ ] `packages/mail/test/mime-messages.test.ts` ports every spec by name.
- [ ] A spec failing on a port bug is fixed in the port, or filed as its own
      story and left `it.skip` pointing at it.
