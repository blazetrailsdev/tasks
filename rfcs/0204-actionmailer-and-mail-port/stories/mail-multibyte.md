---
title: "Port Mail::Multibyte over the activesupport Multibyte port"
status: in-progress
updated: 2026-10-30
rfc: "0204-actionmailer-and-mail-port"
cluster: mail-core
packages: ["mail"]
deps: ["mail-encodings-and-utilities"]
deps-rfc: []
est-loc: 500
priority: null
pr: trails#9472
claim: "2026-10-30T00:54:27Z"
assignee: "mail-multibyte"
blocked-by: null
---

## Context

`vendor/mail/2.8.1/lib/mail/multibyte/` (767 lines: `chars.rb`, `unicode.rb`, `utils.rb`) is a
copy of ActiveSupport's `Multibyte`, used by `Utilities` and
`UnstructuredField` to fold and truncate by character. trails already ports
`ActiveSupport::Multibyte::Chars`.

## Acceptance criteria

- `Mail::Multibyte` ported at its Ruby names, reusing activesupport's unicode
  tables rather than copying them, with each borrowed call cited.
- `spec/mail/multibyte_spec.rb` passes.
