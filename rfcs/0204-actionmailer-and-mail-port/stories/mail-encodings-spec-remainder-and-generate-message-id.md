---
title: "mail-encodings-spec-remainder-and-generate-message-id"
status: ready
updated: 2026-10-30
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

`mail-rfc2047-value-encodings-and-charset-utilities` ported `vendor/mail/2.8.1/lib/mail/encodings.rb:53-312` and the charset half of `utilities.rb` into `packages/mail/src/encodings.ts` / `utilities.ts`, and 29 tests of `vendor/mail/2.8.1/spec/mail/encodings_spec.rb` into `packages/mail/src/encodings.test.ts`; the PR ceiling cut the rest.

Left:

- The rest of `encodings_spec.rb`, verbatim names. The tests calling `Mail.new` (`:286`, `:300`, `:318`) wait on `mail-message-core`.
- `Utilities.generate_message_id` (`utilities.rb:298`), which needs `Mail.random_tag` (`mail.rb:243-248`); `mail.rb` is unported.
- `ruby-compat` `encode` reads its multibyte sources through `TextDecoder`, whose WHATWG tables map bytes Ruby leaves undefined (0x81 in Windows-1252).

## Acceptance criteria

- [ ] Every remaining `encodings_spec.rb` test is ported under its verbatim name, or parked on `mail-message-core`.
- [ ] `generate_message_id` is ported at its Ruby name.
