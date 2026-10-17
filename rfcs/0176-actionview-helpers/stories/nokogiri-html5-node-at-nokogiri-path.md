---
title: "Move Nokogiri HTML5::Node and Attr to Nokogiri's file paths"
status: in-progress
updated: 2026-10-17
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9013
claim: "2026-10-17T22:02:38Z"
assignee: "distance-of-time-in-words-drops-invented-defaults"
blocked-by: null
closed-reason: null
---

## Context

`HTML5::Node` (`packages/nokogiri/src/html5/document-fragment.ts`) lives in the fragment file, but Nokogiri defines it in `vendor/nokogiri/v1.18.3/lib/nokogiri/html5/node.rb`. It still carries `@noRailsEquivalent PERMANENT`, and so does `Attr`, which is Nokogiri's `XML::Attr` (`lib/nokogiri/xml/attr.rb`). trails#9008 moved `Document` to `html5/document.ts` but left these two in place.

## Acceptance criteria

- [ ] `Node` moves to `packages/nokogiri/src/html5/node.ts`, and `Attr` moves to the path of the Nokogiri file that defines it.
- [ ] Both `@noRailsEquivalent` tags are removed.
