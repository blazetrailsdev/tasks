---
title: "nokogiri-html5-document-fragment-inherits-xml"
status: in-progress
updated: 2026-11-11
rfc: "0219-actiontext-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10010
claim: "2026-11-11T23:11:33Z"
assignee: "nokogiri-html5-create-element-namespace-definitions"
blocked-by: null
closed-reason: null
---

## Context

Nokogiri's `HTML5::DocumentFragment < HTML4::DocumentFragment < XML::DocumentFragment`
(`vendor/nokogiri/v1.18.3/lib/nokogiri/html5/document_fragment.rb:27`,
`html4/document_fragment.rb:5`). In trails `packages/nokogiri/lib/html5/document-fragment.ts`
is a standalone class over parse5, and `XML::DocumentFragment` (`xml/document-fragment.ts`)
extends the libxml-backed `XmlNode`. trails#9970 bridged `instanceof XML.DocumentFragment`
with a `static [Symbol.hasInstance]` arm on the XML class so `ActionText::Fragment.wrap`'s
`when Nokogiri::XML::DocumentFragment` (`actiontext/lib/action_text/fragment.rb:12`) matches.

## Acceptance criteria

- The HTML5 fragment's class chain reaches `XML::DocumentFragment` (through an HTML4 class if needed)
  so `instanceof` holds without a `Symbol.hasInstance` arm.
- The `@inventedArm html5` receipt on `XML::DocumentFragment[Symbol.hasInstance]` is deleted with the arm.
