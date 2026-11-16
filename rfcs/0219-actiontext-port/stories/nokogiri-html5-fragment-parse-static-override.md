---
title: "HTML5::DocumentFragment.parse overrides XML's static parse without the alias"
status: ready
updated: 2026-11-16
rfc: "0219-actiontext-port"
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

`HTML5::DocumentFragment.parse(input, encoding_ = nil, positional_options_hash = nil, **options)`
(`vendor/nokogiri/v1.18.3/lib/nokogiri/html5/document_fragment.rb`) overrides
`XML::DocumentFragment.parse(tags, options_ = ParseOptions::DEFAULT_XML, &block)`
(`vendor/nokogiri/v1.18.3/lib/nokogiri/xml/document_fragment.rb`) with different positional
types. TypeScript checks the static side of `class DocumentFragment extends XmlDocumentFragment`
and rejects it (TS2417). After nokogiri-html5-node-is-xml-node, `packages/nokogiri/lib/html5/document-fragment.ts`
extends `_XmlDocumentFragment`, a typed (cast-free) alias that keeps the full instance type and drops
only the static side, under `@noRailsEquivalent CONVERGEABLE nokogiri-html5-fragment-parse-static-override`.

## Acceptance criteria

- `HTML5::DocumentFragment` extends `XML::DocumentFragment` directly, with both `parse` signatures
  as Ruby has them, or the operator ratifies the static-override shape in CLAUDE.md (as § "Override
  arity" does for instance methods).
- The `_XmlDocumentFragment` alias and its receipt are deleted.
