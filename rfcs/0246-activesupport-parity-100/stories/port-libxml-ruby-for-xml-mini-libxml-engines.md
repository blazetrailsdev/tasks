---
title: "port-libxml-ruby-for-xml-mini-libxml-engines"
status: draft
updated: 2026-11-21
rfc: "0246-activesupport-parity-100"
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

# port libxml-ruby's LibXML::XML surface (prerequisite of XmlMini LibXML engines)

## Context

`vendor/rails/v8.0.2/activesupport/lib/active_support/xml_mini/libxml.rb` and `xml_mini/libxmlsax.rb`
`require "libxml"` and call `LibXML::XML::Parser.io`, `LibXML::XML::SaxParser`, `Node#each_child`,
`each_attr`, `element?`/`text?`/`cdata?`. No trails package ports libxml-ruby and the gem is not
vendored, so `activesupport-port-xml-mini-libxml-engines` cannot start.

## Acceptance criteria

- [ ] Vendor libxml-ruby under `vendor/libxml-ruby/<version>/` and port the `LibXML::XML` parser, SAX parser and node surface those two engines use, backed by the libxml2-wasm binding `@blazetrails/nokogiri` already loads.
