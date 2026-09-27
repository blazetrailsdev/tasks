---
title: "Port Template#encode! so Sources::File can read with binread"
status: draft
updated: 2026-09-27
rfc: "0140-actionview-rendering-core"
cluster: null
packages: ["actionview"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionView::Template#encode!`
(`vendor/rails/v8.0.2/actionview/lib/action_view/template.rb:321-354`) is unported:
trails' `Template#compiledSource` (`packages/actionview/src/template.ts`) hands
`this.source` straight to the handler where Rails' `compiled_source`
(`template.rb:443-446`) calls `source = encode!` first. `encode!` treats a BINARY
source as bytes, strips a leading `# encoding:` magic comment
(`LEADING_ENCODING_REGEXP`), force-encodes to that or `Encoding.default_external`,
and raises `WrongEncodingError` for invalid bytes.

Because nothing decodes, both file-backed sources read decoded text instead of
bytes: `Template::Sources::File#to_s` (`template/sources/file.rb:11-13`,
`::File.binread`) is ported as `File.read` in
`packages/actionview/src/template/sources/file.ts`. The call gate equates
`read` with `binread`, so no receipt marks it.

## Acceptance criteria

- `Template#encodeBang` is ported and `compiledSource` calls it as Rails does,
  with `WrongEncodingError` (`template/error.rb`).
- `Template::Sources::File#toString` reads with `File.binread`, and a UTF-8 and a
  magic-comment-encoded template file render correctly through
  `FileSystemResolver`.
