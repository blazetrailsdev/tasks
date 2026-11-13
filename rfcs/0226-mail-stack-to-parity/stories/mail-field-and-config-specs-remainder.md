---
title: "Port message_id_field_spec, envelope_spec, mail_spec and the single-example field-spec gaps"
status: done
updated: 2026-11-13
rfc: "0226-mail-stack-to-parity"
cluster: null
packages:
  - "mail"
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: trails#10049
claim: "2026-11-13T00:09:51Z"
assignee: "mail-field-and-config-specs-remainder"
blocked-by: null
closed-reason: null
---

## Context

Unported files: `spec/mail/fields/message_id_field_spec.rb` (20),
`spec/mail/fields/envelope_spec.rb` (3), `spec/mail/mail_spec.rb` (4).
Single gaps in ported files: `field_spec.rb` "matches … to …" (:78),
`fields/sender_field_spec.rb` "should reject headers with multiple mailboxes"
(:22), `fields/common_message_id_spec.rb` "should allow us to encode an in reply
to field" (:19), and the unmatched examples in `resent_date_field_spec.rb` (2),
`resent_message_id_field_spec.rb` (1) and `header_spec.rb` (1).

## Acceptance criteria

- [ ] Every listed spec is ported by name, or its name mismatch is fixed so
      `pnpm parity:test --package mail` credits it.
