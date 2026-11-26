---
title: "nokogiri: Gumbo.fragment form-ancestor walk for non-element contexts and annotation-xml encoding"
status: done
updated: 2026-11-26
rfc: "0199-nokogiri-html-sanitizer-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#10790
claim: "2026-11-26T10:14:47Z"
assignee: "nokogiri-gumbo-fragment-context-form-walk-and-encoding"
blocked-by: null
closed-reason: null
---

## Context

`noko_gumbo_s_fragment` (`vendor/nokogiri/v1.18.3/ext/nokogiri/gumbo.c:494-530`) walks a node context's ancestors for an HTML `form` (skipping non-elements), and for a MathML `annotation-xml` context reads its `encoding` attribute into `fragment_encoding`. `fragment` in `packages/nokogiri/lib/gumbo.ts` hands a non-element context a detached element (so no ancestor walk) and never reads `encoding`.

## Acceptance criteria

- A non-element node context still finds a form ancestor, as `gumbo.c` does.
- An `annotation-xml` context's `encoding` attribute reaches the fragment parse.
