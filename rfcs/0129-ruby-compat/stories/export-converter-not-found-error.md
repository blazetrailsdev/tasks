---
title: "export-converter-not-found-error"
status: draft
updated: 2026-09-06
rfc: "0129-ruby-compat"
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

`Encoding::ConverterNotFoundError` (`vendor/ruby/transcode.c:4740`
`rb_eConverterNotFoundError`, raised by `rb_econv_open_exc` at
`transcode.c:2097-2105`) is declared module-private in
`packages/ruby-compat/src/io.ts`, beside the only thing that raises it —
`doWriteconv` (`vendor/ruby/io.c:1904`), which raises it where a stream's
external encoding is one `TextEncoder` cannot produce.

Ruby's is a public `EncodingError` subclass a caller can rescue by class.
trails' is not exported, and not reachable from `@blazetrails/ruby-compat`,
because ruby-compat's extra-surface mark is only-shrink
(`scripts/api-compare/extra-surface-mark.json`, `total: 57`) and a new public
name raises it — measured at 58 when the class lived in its own file. The mark
file's own module comment sanctions the fix: "A later need is a later story
against RFC 0129 carrying its motivating call site, and the mark moves up only
as a reviewed line of that story's diff."

The motivating call site is `doWriteconv` and it is already in the tree
(#7542).

## Acceptance criteria

- `ConverterNotFoundError` moves to `packages/ruby-compat/src/converter-not-found-error.ts`
  with its `vendor/ruby/transcode.c` citation and a `@noRailsEquivalent
PERMANENT` receipt, and is exported from the package index.
- `scripts/api-compare/extra-surface-mark.json`'s `ruby-compat.total` moves
  57 → 58 as the reviewed line of this story's diff; `novel` stays pinned at 0.
- `io.ts`'s module-private declaration and the paragraph explaining why it is
  module-private are gone; `doWriteconv` imports the class instead.
- `pnpm parity:api:extra:gate` passes.
