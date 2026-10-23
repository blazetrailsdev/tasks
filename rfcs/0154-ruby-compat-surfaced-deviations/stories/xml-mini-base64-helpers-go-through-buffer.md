---
title: "XmlMini's Base64 helpers go through Buffer, not ruby-compat Base64"
status: draft
updated: 2026-10-05
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/xml-mini.ts` carries two file-local helpers,
`encode64` and `decode64` (`:62-72`), built on `Buffer`. Rails'
`activesupport/lib/active_support/xml_mini.rb` calls `::Base64.encode64` in the
`"binary"` formatter (`:61`) and `::Base64.decode64` in the `"base64Binary"`
parser and in `_parse_binary` / `_parse_file` (`:84,172,181`).
ruby-compat's `Base64` (`packages/ruby-compat/src/base64.ts`) now has both:
`encode64` (`base64.ts:17-21`, `vendor/ruby/v3.3.11/lib/base64.rb:219`) and
`decode64` (`base64.ts:45-54`, `base64.rb:241`). The local helpers are
`xml-mini.ts:63-73`.

## Acceptance criteria

- `xml-mini.ts` calls `Base64.encode64` and `Base64.decode64` at the sites Rails
  does, and the two local helpers and their `Buffer` use are gone.
- `pnpm parity:api:calls` shows no new row for `xml-mini.ts`.
