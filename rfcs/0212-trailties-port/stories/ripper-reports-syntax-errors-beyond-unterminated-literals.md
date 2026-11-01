---
title: "ripper-reports-syntax-errors-beyond-unterminated-literals"
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

`Ripper` in `packages/ruby-compat/src/ripper.ts` (trails#9583) tokenizes only. `isError` is true for an unterminated literal alone, so `SourceAnnotationExtractor::ParserExtractor#annotations` returns comments where `return [] unless result.success?` (`vendor/rails/v8.0.2/railties/lib/rails/source_annotation_extractor.rb:29`) drops them. `x = y ?1:'#'`, `yield /#/`, `foo ?a : 2` and `x = a ?'b' : 'c'` fail Prism and yield comments here. Locals are also one flat set reset at `def`, where `parse.y` keeps a scope stack (`local_push`).

Valid code is also rejected: `a = 1\ndef x; end\na /2\n` reports an error, because the set forgets `a` at `def`.

## Acceptance criteria

- `Ripper#isError` answers true for those snippets, through a grammar check or a real parser, or the repo owner rules the reduced lexer permanent.
- The `CONVERGEABLE` receipts in `ripper.ts` are removed.
- `a = 1\ndef x; end\na /2\n` is not an error: locals follow `local_push` scopes.
- `a => b\nb /2\n# c\n` is not an error: rightward assignment binds `b`.
- Assignment and `def` binders read as `parse.y` does: `(a, b) = 1, 2`, `a, (b, c) = 1, [2]`, and `def (a).b(c)` learn their names, and `foo(puts, y = 1)` does not learn `puts`.
- `puts a, b = 1\na /'/\n# c\n` does not learn `a`'s neighbour as a call argument, and `undef /, % # c\n` reads each name after a comma as an fname.
- `for a,\n b in c\n b /2\nend\n# c\n` learns `b`: `FOR_VARS` reads past the newline.
