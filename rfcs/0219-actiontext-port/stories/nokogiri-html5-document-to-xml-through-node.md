---
title: "Nokogiri HTML5::Document answers to_xml / write_to through Node; port test_to_xml"
status: ready
updated: 2026-11-10
rfc: "0219-actiontext-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Nokogiri::HTML5::Node#write_to` (`vendor/nokogiri/v1.18.3/lib/nokogiri/html5/node.rb:39-67`) was ported in trails#9927 (`packages/nokogiri/lib/html5/node.ts`, including `nativeWriteTo`). Three gaps remain:

- `XML::Node#to_xml` (`vendor/nokogiri/v1.18.3/lib/nokogiri/xml/node.rb:1401-1404`) was added to the HTML5 `Node`, because `HTML5::Document` (`packages/nokogiri/lib/html5/document.ts`) is not a `Node`. `Document#to_xml` therefore does not exist, and `test_to_xml` (`vendor/nokogiri/v1.18.3/test/html5/test_monkey_patch.rb:7-11`) is unported.
- `nativeWriteTo`'s document arm (the XML declaration) is reached only by wrapping `doc._node` in a `Node` by hand.
- `test_fragment_body`'s `NodeSet#to_xml` (`test/html5/test_nokogumbo.rb:74-78`) is unported.

## Acceptance criteria

- [ ] `HTML5::Document` answers `toXml` / `writeTo` through the same `Node` path, as `Document < XML::Document < XML::Node` does in nokogiri.
- [ ] `TestHtml5SerializationMonkeyPatch#test_to_xml` is ported as `it("to_xml")`.
- [ ] `test_fragment_body` is ported, or filed as a separate story.
