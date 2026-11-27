---
title: "Port do_xinclude's safe_copy arm onto XML::Node"
status: blocked
updated: 2026-11-27
rfc: "0199-nokogiri-html-sanitizer-parity"
cluster: null
packages: []
deps:
  - nokogiri-libxml2-wasm-export-missing-c-functions
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-27T01:14:45Z"
assignee: "nokogiri-do-xinclude-safe-copy-arm"
blocked-by: "story nokogiri-libxml2-wasm-export-missing-c-functions: libxml2-wasm 0.7.1 exports no _xmlDocCopyNode, _xmlReplaceNode or _xmlXIncludeProcessTreeFlags, which safe_process_xinclude (ext/nokogiri/xml_node.c:2265) calls"
closed-reason: null
---

## Context

nokogiri v1.19.7 gave `XML::Node#do_xinclude` a `safe_copy:` keyword
(`vendor/nokogiri/v1.19.7/lib/nokogiri/xml/node.rb:576-588`): with
`safe_copy: true` (the default) on libxml2 it walks
`xpath(XINCLUDE_QUERY, XINCLUDE_NAMESPACES)` and calls
`safe_process_xinclude` on each include node, so wrapped nodes survive;
otherwise it calls `process_xincludes`. `Document.parse` passes
`safe_copy: false` (`xml/document.rb:88-90`).

trails' `doXinclude` lives on `XmlDocument`
(`packages/nokogiri/lib/xml/document.ts`), not `XmlNode`, takes the
`safeCopy` keyword since the 1.19.7 burn-down, and always takes the
`process_xincludes` arm.

## Acceptance criteria

- [ ] `doXinclude` moves to `XmlNode` at its Rails file, with the
      `safe_copy` arm ported (`XINCLUDE_QUERY`, `XINCLUDE_NAMESPACES`,
      `safe_process_xinclude`).
- [ ] The `@missingRailsCall` receipt on `doXinclude` is removed.
- [ ] The `test/xml/test_xinclude.rb` v1.19.7 tests that turn on
      `safe_copy` are ported.
