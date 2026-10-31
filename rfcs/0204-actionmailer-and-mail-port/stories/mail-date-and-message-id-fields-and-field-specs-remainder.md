---
title: "mail-date-and-message-id-fields-and-field-specs-remainder"
status: draft
updated: 2026-10-31
rfc: "0204-actionmailer-and-mail-port"
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
closed-reason: null
---

## Context

`mail-common-and-address-fields` shipped `packages/mail/src/fields/` for the bases, `unstructured_field.rb`, `optional_field.rb`, `subject_field.rb` and the address fields, with `Utilities.generate_message_id`, and stopped at the PR ceiling.

Left:

- `vendor/mail/2.8.1/lib/mail/fields/common_date_field.rb`, `date_field.rb`, `resent_date_field.rb`, `common_message_id_field.rb`, `message_id_field.rb`, `resent_message_id_field.rb`. `DateTime.parse` returns a Temporal value in `@blazetrails/date`, so format with its exported `strftime(datetime, fmt)`.
- The rest of `spec/mail/fields/{common_field,common_address,common_date,common_message_id,structured_field,unstructured_field,to_field,cc_field,bcc_field,from_field,sender_field,reply_to_field,resent_*_field,return_path_field}_spec.rb`. Tests calling `Mail.new` wait on `mail-message-core`.
- The rest of `vendor/mail/2.8.1/spec/mail/encodings_spec.rb`: `packages/mail/src/encodings.test.ts` holds 29 of its tests. `:286`, `:300` and `:318` call `Mail.new` and wait on `mail-message-core`.

## Acceptance criteria

- [ ] The six date and message-id fields are ported at their Ruby names.
- [ ] Every remaining test in those specs is ported under its verbatim name, or parked on `mail-message-core`.
