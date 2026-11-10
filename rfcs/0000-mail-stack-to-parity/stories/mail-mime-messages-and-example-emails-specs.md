---
title: "Port mime_messages_spec.rb and example_emails_spec.rb"
status: draft
updated: 2026-11-09
rfc: "0000-mail-stack-to-parity"
cluster: null
packages:
  - "mail"
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/mail/2.8.1/spec/mail/mime_messages_spec.rb` (67 tests) and
`spec/mail/example_emails_spec.rb` (31 tests, over the fixture emails in
`spec/fixtures/emails/`) have no TS files. Both exercise `Mail::Message`
end to end, which the earlier mail RFC ported.

## Acceptance criteria

- [ ] `packages/mail/test/mime-messages.test.ts` and `example-emails.test.ts` port
      every spec by name, with any fixture email copied verbatim to
      `packages/mail/test/fixtures/`.
- [ ] A spec that fails on a port bug is fixed in the port, or filed as its own
      story in this RFC and left `it.skip` pointing at it.
