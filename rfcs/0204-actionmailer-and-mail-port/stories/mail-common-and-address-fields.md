---
title: "Port mail's field base classes and address fields"
status: done
updated: 2026-10-31
rfc: "0204-actionmailer-and-mail-port"
cluster: mail-core
packages: ["mail"]
deps: ["mail-elements"]
deps-rfc: []
est-loc: 700
priority: null
pr: trails#9539
claim: "2026-10-31T16:43:43Z"
assignee: "mail-common-and-address-fields"
blocked-by: null
---

## Context

`vendor/mail/2.8.1/lib/mail/fields/` holds 39 files (1,824 lines). This slice is the bases and the
address fields (~730 lines): `common_field.rb`, `common_address_field.rb`,
`common_date_field.rb`, `common_message_id_field.rb`, `named_*`,
`structured_field.rb`, `unstructured_field.rb` (RFC 2047 encoded-word folding)
and `to`, `cc`, `bcc`, `from`, `sender`, `reply_to`, `resent_*`,
`return_path` fields.

## Acceptance criteria

- Ported at their Ruby names; encoded-word folding byte-exact.
- Their `spec/mail/fields/*_spec.rb` pass.
