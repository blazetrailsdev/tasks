---
title: "ruby-compat: an encoding-tagged String so force_encoding tags, b and valid_encoding? read the tag"
status: draft
updated: 2026-09-30
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionView::Template::Handlers::ERB#call` (`vendor/rails/v8.0.2/actionview/lib/action_view/template/handlers/erb.rb:63-75`) and `valid_encoding` (`:95-107`) depend on a Ruby String carrying an encoding tag. `source.b` gives the bytes, `force_encoding` re-tags them, and `string.encoding` is read back. `Template#encode!` (`vendor/rails/v8.0.2/actionview/lib/action_view/template.rb:321-356`) hands a `handles_encoding?` handler a BINARY File source that is only _tagged_ `Encoding.default_external`.

A JS string has no tag. ruby-compat's `forceEncoding` (`packages/ruby-compat/src/string/force-encoding.ts`) decodes instead of tagging, and `b` (`string/b.ts`) assumes a decoded Unicode receiver. So `Tse#call` cannot tell a String source (Unicode, where `.b` is its UTF-8 bytes and the default is UTF-8) from undecoded File bytes (one char per byte, where `.b` is the identity and the default is `default_external`). The same code unit U+00FC means `ü` in the first and byte 0xFC in the second. This blocks `tse-handler-ports-erb-encoding-tag-and-valid-encoding` (RFC 0140).

## Acceptance criteria

- ruby-compat has one settled representation for a String whose bytes and encoding tag are both observable, e.g. a byte-form string paired with an `Encoding`. `String#b`, `force_encoding`, `valid_encoding?` and `encoding` are defined over it without decoding on `force_encoding`.
- `Template#encodeBang`'s `handles_encoding?` arm (`template.rb:342-343`) can hand the handler the tagged, undecoded source through that representation. `Tse#call` can then port `source.b`, the `ENCODING_TAG` strip and `valid_encoding` line for line.
- The representation is documented in `packages/ruby-compat/README.md`, and `tse-handler-ports-erb-encoding-tag-and-valid-encoding` is unblocked.
