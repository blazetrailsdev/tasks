---
title: "HTML5::Node#inner_html keeps its return-super-unless-HTML5-document guard"
status: draft
updated: 2026-11-15
rfc: "0219-actiontext-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`HTML5::Node#inner_html` (`vendor/nokogiri/v1.18.3/lib/nokogiri/html5/node.rb:31-37`) opens with
`return super unless document.is_a?(HTML5::Document)`. trails' `innerHtml`
(`packages/nokogiri/lib/html5/node.ts`, under `@missingRailsArgs join`) drops that guard. Now that
`HTML5::Node` extends `XmlNode` (trails#10119), `super` exists to fall back to, as the ported
`fragment` (html5/node.rb:70-74) already does.

## Acceptance criteria

- `innerHtml` begins with `if (!(this.document instanceof HTML5.Document)) return super.innerHtml(options);`,
  matching html5/node.rb:32. If `XmlNode` has no `innerHtml` yet, port `XML::Node#inner_html`
  (xml/node.rb) so that `super` reaches it.
