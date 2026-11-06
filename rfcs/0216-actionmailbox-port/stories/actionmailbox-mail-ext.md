---
title: "Port ActionMailbox's mail_ext reopenings of Mail::Address, Mail::Message and Mail"
status: ready
updated: 2026-11-06
rfc: "0216-actionmailbox-port"
cluster: amb-core
packages: ["actionmailbox"]
deps:
  [
    "actionmailbox-package-and-parity-enrollment",
    "mail-common-and-address-fields",
    "mail-message-core",
  ]
deps-rfc: []
est-loc: 250
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionmailbox/lib/action_mailbox/mail_ext.rb` requires five files that reopen classes
from the `mail` gem (`packages/mail`):

- `mail_ext/address_equality.rb:5-7`: `Mail::Address#==`, true for another
  `Mail::Address` with the same `to_s`.
- `mail_ext/address_wrapping.rb:5-7`: `Mail::Address.wrap`.
- `mail_ext/addresses.rb:5-42`: `Mail::Message#from_address`,
  `#recipients_addresses`, `#to_addresses`, `#cc_addresses`,
  `#bcc_addresses`, `#x_original_to_addresses`,
  `#x_forwarded_to_addresses`, private `#address_list` (its
  `respond_to?(:element)` arm).
- `mail_ext/from_source.rb:4-6`: `Mail.from_source`, `Mail.new` over
  `Mail::Utilities.binary_unsafe_to_crlf(source.to_s)`
  (`packages/mail/src/utilities.ts:189`).
- `mail_ext/recipients.rb:5-8`: `Mail::Message#recipients`.

Tests: `test/unit/mail_ext/address_equality_test.rb` (1),
`addresses_test.rb` (8), `address_wrapping_test.rb` (1).

## Acceptance criteria

- Each method is defined in `packages/actionmailbox/src/mail-ext/<file>.ts` at
  the Rails path, in the shape the RFC's Design section "`mail_ext` reopens
  `Mail` classes from another package" settles, and never in `packages/mail`.
- `Address#==` is the `eql` / `rbEqual` hook (CLAUDE.md § "Ruby protocol
  methods with a different JS mechanism"); `address_list` keeps Rails'
  `isRespondTo` branch and is `private` + `@internal`.
- The three test files pass, names verbatim.
- `parity:api` credits the six files to actionmailbox.
