---
title: 'XmlMini#_parse_hex_binary is [bin].pack("H*"), not Buffer'
status: draft
updated: 2026-11-12
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::XmlMini#_parse_hex_binary`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/xml_mini.rb:189-191`) is
`[bin].pack("H*")`. The port, `_parseHexBinary` in
`packages/activesupport/lib/xml-mini.ts`, is
`Buffer.from(bin, "hex").toString("binary")`. trails#10043 moved this file's
Base64 helpers onto ruby-compat and left this `Buffer` call behind.
ruby-compat's `pack` (`packages/ruby-compat/lib/array.ts`) already handles the
`H` directive (`vendor/ruby/v3.3.11/pack.c`).

## Acceptance criteria

- [ ] `_parseHexBinary` is `pack([bin], "H*")`, with no `Buffer`.
- [ ] The xml-mini tests that read hex (`_parse_hex_binary decodes hex to bytes`,
      `base64Binary and binary`) still pass.
- [ ] `pnpm parity:api:calls` shows no new row for `xml-mini.ts`.
