---
title: "Seat every transfer encoding on Mail::Encodings"
status: ready
updated: 2026-11-04
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby names each transfer encoding as a constant under `Mail::Encodings`
(`vendor/mail/2.8.1/lib/mail/encodings/base64.rb:6`, `7bit.rb`, `8bit.rb`,
`binary.rb`, `identity.rb`, `unix_to_unix.rb`), and the specs read them that way
(`attachments_list_spec.rb:6`, `Mail::Encodings::Base64.encode`). In the port
only `QuotedPrintable` is seated on the `Encodings` namespace
(`packages/mail/src/encodings/quoted-printable.ts:42`,
`packages/mail/src/encodings.ts:28`). `Encodings.Base64` is undefined, so
trails#9701's `attachments-list.test.ts` imports `Base64` from
`./encodings/base64.js` directly.

## Acceptance criteria

- `Encodings` declares, and each encoding module seats, `Base64`, `SevenBit`,
  `EightBit`, `Binary`, `Identity`, `TransferEncoding` and `UnixToUnix`, the same
  way `QuotedPrintable` is seated.
- `attachments-list.test.ts` reads `Encodings.Base64.encode`, as
  `attachments_list_spec.rb:6` does.
