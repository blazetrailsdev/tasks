---
title: "Seat Nokogiri::CSS::Tokenizer and Tokenizer::ScanError by plain assignment"
status: draft
updated: 2026-11-15
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10117 moved nokogiri's CSS/SAX/Racc/XML seats to plain assignments but left
`packages/nokogiri/lib/css/tokenizer.ts:130-131` on `constSet(CSS, "Tokenizer", Tokenizer)` and
`constSet(Tokenizer, "ScanError", ScanError)`. Nokogiri's `lib/nokogiri/css/tokenizer.rb` defines
`class Tokenizer` and `class ScanError < ::StandardError` lexically inside `module CSS`; neither body calls
`const_set`, so per CLAUDE.md § "Call-time constant resolution" the seat is a plain assignment.

## Acceptance criteria

- `CSS.Tokenizer = Tokenizer;` and `Tokenizer.ScanError = ScanError;` (with `declare static ScanError` on
  `Tokenizer`), `constSet` import removed.
- `rbModName(ScanError)` still answers `Nokogiri::CSS::Tokenizer::ScanError` on the built dist.
