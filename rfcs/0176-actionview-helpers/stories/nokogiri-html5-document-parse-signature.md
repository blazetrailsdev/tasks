---
title: "nokogiri-html5-document-parse-signature"
status: done
updated: 2026-10-17
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9008
claim: "2026-10-17T18:40:29Z"
assignee: "nokogiri-html5-document-parse-signature"
blocked-by: null
closed-reason: null
---

## Context

`Nokogiri::HTML5::Document.parse(string_or_io, url = nil, encoding = nil, **options, &block)`
(nokogiri v1.16.0 `lib/nokogiri/html5/document.rb:34-86`) accepts a nil/absent input, an IO, a
URL, an encoding, parse options and a config block. trails#8947 added
`HTML5.Document` in `packages/nokogiri/src/html5/document-fragment.ts` with
`parse(string: string)` only and a `@noRailsEquivalent PERMANENT` tag copied from its
sibling `DocumentFragment`. Nokogiri is not vendored under `vendor/`.

## Acceptance criteria

- [ ] Nokogiri is vendored (or the class is mapped for parity), `HTML5.Document` and `HTML5.DocumentFragment` live at Nokogiri's file paths, and the `@noRailsEquivalent` tags are removed.
- [ ] `parse` takes `stringOrIo = null` (nil → `""`), `url`, `encoding` and options in Nokogiri's order, reading an IO through the ruby-compat `read` shim.
