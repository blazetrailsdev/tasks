---
title: "parser-extractor-reads-ruby-comments-with-a-real-parser"
status: draft
updated: 2026-11-01
rfc: "0212-trailties-port"
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

## Context

`SourceAnnotationExtractor::ParserExtractor#annotations`
(`vendor/rails/v8.0.2/railties/lib/rails/source_annotation_extractor.rb:27-34`)
reads Ruby comments through Prism or Ripper. trails has no Ruby parser, so
`Parser#parse` in `packages/trailties/src/source-annotation-extractor.ts` is a
quote-aware character scan. A `#` inside a heredoc or `%q` literal reads as a
comment, and only an unterminated quote counts as a parse error.

## Acceptance criteria

- `Parser#parse` reads comments through a real Ruby parser or tokenizer, or the
  repo owner rules the scan permanent.
- Its `@noRailsEquivalent` and `isError` receipts are updated to match.
