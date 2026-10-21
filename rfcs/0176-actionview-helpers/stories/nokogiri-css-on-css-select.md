---
title: "nokogiri-css-on-css-select"
status: draft
updated: 2026-10-19
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Repo owner direction (2026-10-19): back nokogiri's CSS matching with
`css-select` (cheerio's engine, matches parse5 trees via a tree adapter, no
DOM) as the logic under the compat layer, instead of a hand-rolled matcher.

- `packages/nokogiri/src/xml/searchable.ts` — `css` → `cssInternal` →
  `cssRulesToXpath` / `xpathInternal`, over parse5 nodes. `Compound` carries
  `@noRailsEquivalent CONVERGEABLE port-nokogiri-css-xpath-visitor`.
- `port-nokogiri-css-xpath-visitor` (trails#9060, in progress) ports Nokogiri's
  CSS parser + XPath visitor into the same file. Rails' path is CSS → XPath →
  libxml2 (`Nokogiri::XML::Searchable#css`, `Nokogiri::CSS::XPathVisitor`).
- Consumer: `packages/actionview/src/testing/selector-assertions.ts`
  (`cssSelect` / `assertSelect` → `nodeset(root).css(...)`).

## Open question (decide before starting)

How this relates to #9060: replace the matcher (a deviation from Nokogiri's
CSS→XPath path, needs an owner ruling and a `PERMANENT` receipt), or use
`css-select` as a test oracle cross-checking the ported visitor.

## Acceptance criteria

- `css-select` (with a parse5 adapter) evaluates `Searchable#css` selectors
  in the chosen role.
- Nokogiri CSS extensions css-select lacks (`:contains`, `%`, XPath
  functions) still behave as Nokogiri does.
- `selector-assertions.test.ts` and nokogiri tests stay green.
