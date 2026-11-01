---
title: "source-annotation-extractor-scans-comment-tokens-not-lines"
status: draft
updated: 2026-11-01
rfc: "0171-thor-port"
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

`Rails::SourceAnnotationExtractor` scans `.rb` with a Ripper-based parser (`vendor/rails/v8.0.2/railties/lib/rails/source_annotation_extractor.rb`), so a `# TODO` inside a string literal is not a note (`vendor/rails/v8.0.2/railties/test/commands/notes_test.rb:171`). `packages/trailties/src/source-annotation-extractor.ts` only has line regexes, so `"// TODO: x"` in a `.ts` file is reported. The TypeScript scanner is a plausible analogue of Ripper's comment events.

## Acceptance criteria

- [ ] `.ts` / `.js` files are scanned by comment tokens, not line regexes.
- [ ] `does not pick up notes inside string literals` in `commands/notes.test.ts` is unskipped.
