---
title: "Port Mail::Encodings, encodings/ and Mail::Utilities"
status: draft
updated: 2026-10-22
rfc: "0000-actionmailer-and-mail-port"
cluster: mail-core
packages: ["mail"]
deps: ["vendor-mail-mini-mime-and-net-smtp"]
deps-rfc: []
est-loc: 700
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`vendor/mail/v2.8.1/lib/mail/encodings.rb` (314: RFC 2047 `b_value_encode` / `q_value_encode`,
`value_decode`), `encodings/` (262: base64, quoted-printable, 7bit, 8bit,
binary, `UnixToUnix`) and `utilities.rb` (562). Strings follow CLAUDE.md "Ruby
Strings are JS string primitives"; non-UTF-8 charsets transcode with npm
`iconv-lite` where Ruby calls `String#encode`.

## Acceptance criteria

- Ported at their Ruby names; `encodings_spec.rb`, `encodings/*_spec.rb` and
  `utilities_spec.rb` pass.
