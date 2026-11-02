---
title: "notes ParserExtractor skips any file with a syntax error"
status: draft
updated: 2026-11-02
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ParserExtractor#annotations` returns no annotations for a file that does not parse: `return [] unless result.success?` (`vendor/rails/v8.0.2/railties/lib/rails/source_annotation_extractor.rb:27-28`; the Ripper arm is `parser.error? ? [] : parser.comments`, `:52`).

`Parser#isError` in `packages/trailties/src/source-annotation-extractor.ts:64` only reports `scanner.isUnterminated()` (`:88`), because `API.createSourceFile` exposes no parse diagnostics and `getSyntacticDiagnostics` needs a program (trails#9615). A file with any other syntax error, such as an unbalanced brace, still yields annotations where Rails yields none.

## Acceptance criteria

- `isError` is true for any file with a syntax error, read from parse diagnostics of the file itself, through `typescript/unstable/*` with no new runtime dependency.
- `annotations` returns `[]` for such a file, as `:28` does. A test covers an unbalanced brace with a `TODO` comment.
- The unterminated-token arm goes if diagnostics cover it.
