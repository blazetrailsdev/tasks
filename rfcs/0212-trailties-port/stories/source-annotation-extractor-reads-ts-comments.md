---
title: "Read annotations from TS and JS comments with a real tokenizer"
status: ready
updated: 2026-11-01
rfc: "0212-trailties-port"
cluster: tt-surface
packages: ["trailties"]
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

Replaces `parser-extractor-reads-ruby-comments-with-a-real-parser`. trails apps are TS and JS, and trails does not parse Ruby. Rails' `ParserExtractor` (`vendor/rails/v8.0.2/railties/lib/rails/source_annotation_extractor.rb:27-34`) exists so a comment marker inside a string or literal is not read as an annotation. In `packages/trailties/src/source-annotation-extractor.ts` that protection sits on the `builder`/`rb`/`rake`/`ruby` registration, a quote-aware scan of a language trails apps do not contain, while the `ts`, `js`, `mjs`, `cjs`, `tsx` and `jsx` registration is a bare `//` regexp. So `const url = "http://x // TODO: no"` reports an annotation, and `/* TODO: x */` does not.

## Acceptance criteria

- `ts`, `js`, `mjs`, `cjs`, `tsx` and `jsx` files read comments through a real tokenizer, keeping Rails' `ParserExtractor` and `Parser` names, or through a language-forced replacement with a receipt.
- `typescript` is an optional peer of trailties: `trails notes` still works without it, falling back to the current regexp.
- The Ruby registration and the character scan are removed. Tests that feed `.rb` sources translate to `.ts`.
