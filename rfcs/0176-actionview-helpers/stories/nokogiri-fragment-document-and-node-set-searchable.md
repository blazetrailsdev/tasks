---
title: "HTML5 fragment document and NodeSet Searchable include diverge from Nokogiri"
status: in-progress
updated: 2026-10-18
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#9037
claim: "2026-10-18T18:14:53Z"
assignee: "actionview-helpers-umbrella-eager-load-and-final-sweep"
blocked-by: null
closed-reason: null
---

## Context

trails#9031 added `Searchable` to `@blazetrails/nokogiri`. Two shapes still differ from Nokogiri:

- `HTML5::DocumentFragment` passes itself as its nodes' `document` (`packages/nokogiri/src/html5/document-fragment.ts`). In Nokogiri a fragment's `document` is an `HTML5::Document` (`vendor/nokogiri/v1.18.3/lib/nokogiri/html5/document_fragment.rb`, `XML::DocumentFragment#initialize`), so `NodeSet.new(document)` there names a real document.
- `XML::NodeSet` (`packages/nokogiri/src/xml/node-set.ts`) defines `css` itself but does not include `Searchable`, so `NodeSet#at_css` (`xml/node_set.rb` includes `Searchable`, `searchable.rb:143-145`) is missing.

## Acceptance criteria

- [ ] A fragment's nodes answer an `HTML5::Document` for `document`, as Nokogiri's do.
- [ ] `NodeSet` includes `Searchable` with its own `css` override kept, and `atCss` is reachable on it.
