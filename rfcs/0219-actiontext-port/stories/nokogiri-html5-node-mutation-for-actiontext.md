---
title: "nokogiri: HTML5 document and node mutation surface (create_element, inner_html=, replace, ancestors, matches?)"
status: claimed
updated: 2026-11-08
rfc: "0219-actiontext-port"
cluster: at-infra
packages: ["nokogiri"]
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: "2026-11-08T23:50:38Z"
assignee: "actiontext-parity-enrollment-and-package"
blocked-by: null
closed-reason: null
---

## Context

ActionText edits Nokogiri HTML5 fragments in place. `@blazetrails/nokogiri`'s
`HTML5::DocumentFragment` / `HTML5::Node`
(`packages/nokogiri/src/html5/{document-fragment,node,document}.ts`) has
`css`, `children`, attribute reads, `remove_attribute`, `text?` and `remove`,
and none of the following, each at its call site:

- `Document#create_element(name, attrs)`: `vendor/rails/v8.0.2/actiontext/lib/action_text/html_conversion.rb:17-19`, `trix_attachment.rb:27`.
- `Document#fragment(html)` and `Document#encoding=`: `html_conversion.rb:13-15`, `:22-24`.
- `Node#[]=`, `Node#key?`: `content.rb:100-102`, `trix_attachment.rb:28-29`.
- `Node#inner_html` / `inner_html=`: `attachment_gallery.rb:15`, `attachments/minification.rb:13`, `app/helpers/action_text/content_helper.rb:41,47`.
- `Node#replace(string)`: `fragment.rb:45`, `attachment_gallery.rb:22`.
- `Node#ancestors`: `plain_text_conversion.rb:97,108`.
- `Node#matches?(selector)`: `attachment_gallery.rb:33`.
- `DocumentFragment#dup` (deep): `fragment.rb:37`.
- `Node#to_html(save_with: AS_HTML)` and `SaveOptions::AS_HTML`: `html_conversion.rb:10`.
- `NodeSet#each`/`map` over a `css` result and `Node#==`: `fragment.rb:43-45`.

Nokogiri's own definitions are in the vendored gem
(`vendor/nokogiri/**/lib/nokogiri/xml/node.rb`, `xml/document.rb`,
`html5/document_fragment.rb`). RFC 0199 (Nokogiri to parity) is closed, so
this is filed under the ActionText RFC that needs it.

## Acceptance criteria

- Each member above is ported at its Nokogiri name and file, over the parse5
  tree the HTML5 classes already wrap, with the gem's arguments and return
  values (`replace` answers the new node, `inner_html=` answers the value).
- Each has a test mirroring the Nokogiri test where the vendored gem has one;
  others go in a `.trails.test.ts`.
- `parity:api` for nokogiri moves up, never down.
