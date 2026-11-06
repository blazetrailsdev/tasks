---
title: "trailties: ParserExtractor::Parser exists only on Rails' no-Prism arm"
status: draft
updated: 2026-11-06
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails defines `SourceAnnotationExtractor::ParserExtractor::Parser` only in the
`else` arm taken when Prism is missing (`vendor/rails/v8.0.2/railties/lib/rails/source_annotation_extractor.rb:24-56`).
Under Prism, `ParserExtractor#annotations` reads `Prism.parse_file` directly and
no `Parser` constant exists.

trails (`packages/trailties/src/source-annotation-extractor.ts`) always defines
`Parser` and seats it as `ParserExtractor.Parser`, and
`packages/trailties/src/constants.generated.ts` records it unconditionally. The
tokenizer is loaded by an awaited `rbFRequire` in `enumerate`, after the module
body has run. So the `defined?(Prism)` test that Rails makes at class-body time
has no answer when the class is defined.

## Acceptance criteria

- `ParserExtractor` follows Rails' two arms. On the primary-parser arm, `annotations` uses the tokenizer directly and `ParserExtractor::Parser` is not defined. `Parser` is seated only on the fallback arm.
- The `Parser` entry in `constants.generated.ts` follows that arm, or is dropped if the arm is not taken.
