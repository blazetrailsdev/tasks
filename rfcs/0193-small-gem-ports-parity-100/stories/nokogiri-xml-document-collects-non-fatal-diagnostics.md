---
title: "nokogiri-xml-document-collects-non-fatal-diagnostics"
status: draft
updated: 2026-10-23
rfc: "0193-small-gem-ports-parity-100"
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

`Nokogiri::XML::Document#errors` collects every libxml2 diagnostic with its
real level (warning 1, error 2, fatal 3; `vendor/nokogiri/v1.18.3/lib/nokogiri/xml/syntax_error.rb`).
`XmlDocument.parse` (`packages/nokogiri/src/xml/document.ts`) builds its errors
from `XmlParseError#details` only, so it sees diagnostics only when the parse
throws, and always records them at level 3. libxml2-wasm 0.7.1's `ErrorDetail`
(`lib/libxml2.d.mts`) carries `message`, `file`, `line` and `col` but no level,
and a successful `XmlDocument.fromString` exposes no diagnostics at all.

`SyntaxError#level` became the gem's Integer, with the four predicates, in the
PR that closed `nokogiri-syntax-error-level-is-a-string-not-the-gems-integer`.

## Acceptance criteria

- `XmlDocument.parse` records non-fatal libxml2 warnings and errors in
  `#errors`, each with its real level, through a libxml2-wasm API that exposes
  them (upstream change or a newer release).
- A document that parses with warnings reports them, as the gem does.
