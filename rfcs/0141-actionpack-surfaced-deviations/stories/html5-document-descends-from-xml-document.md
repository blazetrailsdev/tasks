---
title: "html5-document-descends-from-xml-document"
status: draft
updated: 2026-11-07
rfc: "0141-actionpack-surfaced-deviations"
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

# HTML5::Document and HTML5::Node descend from XML::Document / XML::Node

## Context

Nokogiri's `HTML5::Document < HTML4::Document < XML::Document` and `HTML5::Node` is an `XML::Node`
(`vendor/nokogiri/*/lib/nokogiri/html5/document.rb`, `html5/node.rb`). In `@blazetrails/nokogiri`,
`HTML5.Document` (`packages/nokogiri/lib/html5/document.ts`) and `XmlDocument`
(`packages/nokogiri/lib/xml/document.ts`) are unrelated classes, and so are `html5/node.ts`'s `Node`
and `xml/node.ts`'s `XmlNode`. Trying `class Document extends XmlDocument` fails on every member that
returns a node (`root`, `atCss`, `atXpath`, `document`) because the node classes are unrelated, and on
`_node` (a parse5 document vs a libxml2 one).

`Searchable#xpath` / `#atXpath` and `NodeSet#xpath` were ported by the PR that closed
`test-response-html-parsed-body-at-xpath`, and "response parsing"
(`packages/actionpack/src/action-dispatch/dispatch/test-response.test.ts`) now carries the
`at_xpath(...).text` assertion. Its `assert_kind_of(Nokogiri::XML::Document, response.parsed_body)`
(`vendor/rails/v8.0.2/actionpack/test/dispatch/test_response_test.rb:39`) is still missing.

## Acceptance criteria

- `HTML5.Node` is a kind of `XML.Node` and `HTML5.Document` is a kind of `XML.Document`.
- "response parsing" carries `assertKindOf(XmlDocument, response.parsedBody)`, and
  `pnpm parity:test --assertions --package actiondispatch` shows no `test_response_test.rb` count row.
