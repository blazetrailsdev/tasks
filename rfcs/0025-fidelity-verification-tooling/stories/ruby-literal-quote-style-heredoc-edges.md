---
title: "extract-ruby-tests: quote-style detection misses single-quoted heredocs / multi-line %q"
status: ready
updated: 2026-07-23
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5123 made `unescape_string_literal` in
`scripts/test-compare/extract-ruby-tests.rb` quote-style aware:
`double_quoted_literal?` reads the source character preceding the literal's
first `@tstring_content` position (`'` or `%q<delim>` → single-quote
semantics, else double). Ripper's sexp does not record the quote style, hence
the source peek.

Two edges the heuristic misclassifies:

- Single-quoted heredocs (`<<~'EOS'`): content starts at column 0 of the next
  line, so `before` is empty and the literal is treated as double-quoted —
  escape sequences inside get cooked when Ruby would keep them raw.
- A `%q` literal whose content starts on a later line similarly loses the
  delimiter context.

Both only matter for value-bearing assertion literals (report-only
`--assertions` comparison, no CI gate), and no current mismatch in the
report stems from them — this is hardening, not a live bug. Fix likely means
walking back from the tstring position across lines to find the opening
delimiter, or capturing quote style during a lexer (Ripper.lex) pass keyed by
position.

## Acceptance criteria

- `--assertions` value tokens for single-quoted-heredoc and multi-line `%q`
  expected literals keep raw backslash sequences.
- Existing extractor unit tests (`scripts/test-compare/`) stay green; add
  cases for both edges.
