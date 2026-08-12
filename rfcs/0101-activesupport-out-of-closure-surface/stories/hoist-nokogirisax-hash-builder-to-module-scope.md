---
title: "hoist-nokogirisax-hash-builder-to-module-scope"
status: done
updated: 2026-08-12
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6438
claim: "2026-08-12T21:36:51Z"
assignee: "hoist-nokogirisax-hash-builder-to-module-scope"
blocked-by: null
closed-reason: null
---

## Context

Triaged in the `triage-partially-ported-out-of-closure-activesupport-residue`
PR. `xml_mini/nokogirisax.rb` scores 1 matched / 10 missing, but eight of those
ten ARE implemented — they just live inside a class declared LOCALLY inside
`parse()` in packages/activesupport/src/xml-mini/nokogirisax.ts:59, so no
extractor can see them:

`current_hash` (nokogirisax.rb:22), `start_document` (:26),
`end_document` (:31), `error` (:35), `start_element` (:39),
`end_element` (:56), `characters` (:73), `cdata_block` (:77) — Rails declares
these on a module-level `HashBuilder < Nokogiri::XML::SAX::Document`.

The class is nested because its base class comes from the OPTIONAL
`@blazetrails/nokogiri` dependency, loaded via a non-literal dynamic
`import()`, and a module-level `extends` would need a top-level await (which
breaks the IIFE/CJS bundles).

Genuinely unported, on top of that: `document_class` / `document_class=`
(nokogirisax.rb:83-84) — the `class_attribute` that lets a caller swap the
HashBuilder.

## Acceptance criteria

- `HashBuilder` is declared at module scope (or in whatever shape keeps the
  eight SAX members visible at the mapped site) without a top-level await, and
  `parse` uses it.
- `documentClass` / `setDocumentClass` land per nokogirisax.rb:83-84.
- `pnpm parity:api` delta non-negative; nokogirisax.rb missing count drops.
