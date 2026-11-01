---
title: "parser-extractor-reads-ruby-comments-with-a-real-parser"
status: closed
updated: 2026-11-01
rfc: "0212-trailties-port"
cluster: null
packages: [trailties]
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9583
claim: "2026-11-01T19:06:41Z"
assignee: "parser-extractor-reads-ruby-comments-with-a-real-parser"
blocked-by: null
closed-reason: "Operator ruling 2026-11-01: trails does not parse Ruby. Replaced by source-annotation-extractor-reads-ts-comments. trails#9583 (Ripper tokenizer) is unmerged; ripper.ts is not on origin/main."
---

## Context

`SourceAnnotationExtractor::ParserExtractor#annotations`
(`vendor/rails/v8.0.2/railties/lib/rails/source_annotation_extractor.rb:27-34`)
reads Ruby comments through Prism or Ripper. trails has no Ruby parser, so
`Parser#parse` in `packages/trailties/src/source-annotation-extractor.ts` is a
quote-aware character scan. A `#` inside a heredoc or `%q` literal reads as a
comment, and an apostrophe in a heredoc, `%q`, regex (`/'/`) or `?'` opens a quote that never
closes, so `isError` is true and `annotations` returns `[]` for the whole file,
where Prism succeeds. Only an unterminated quote counts as a parse error.

## Acceptance criteria

- `Parser#parse` reads comments through a real Ruby parser or tokenizer, or the
  repo owner rules the scan permanent.
- Its `@noRailsEquivalent` and `isError` receipts are updated to match.
