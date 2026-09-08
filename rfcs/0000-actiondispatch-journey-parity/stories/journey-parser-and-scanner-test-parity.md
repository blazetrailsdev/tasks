---
title: "Journey definition parser and scanner test parity"
status: draft
updated: 2026-09-07
rfc: "0000-actiondispatch-journey-parity"
cluster: null
packages: ["actionpack"]
deps: ["journey-test-names-to-rails-def-test-form"]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- `vendor/rails/actionpack/test/journey/route/definition/parser_test.rb` — 21
  tests, all 21 reached by the re-spelling story, 0 trails-only. This story
  verifies the row lands at 21/21 and converges its assertions.
- `vendor/rails/actionpack/test/journey/route/definition/scanner_test.rb` — one
  comparable row, and a structural mismatch behind it.

Rails generates the scanner tests from a table:

```ruby
CASES.each do |pattern, expected_tokens|
  test "Scanning `#{pattern}`" do
```

`scanner_test.rb:70-75`, 27 entries. The extractor drops interpolations and
records the literal prefix only, so the Rails side is a single row named
``Scanning ` ``. trails ported the family as 27 separate literal-named `it`s in
`packages/actionpack/src/action-dispatch/journey/route/definition/scanner.test.ts`,
which credits none of them and scores 27 extra.

The port mirrors Rails' structure: one loop over the same `CASES` table with an
interpolated description, so both sides reduce to the same prefix. See the
interpolation-prefix rule — a fully-resolved literal on the TS side stores the
whole string and will not match.

## Acceptance criteria

- `scanner.test.ts` iterates a `CASES` table mirroring `scanner_test.rb`'s 27
  entries, with the description interpolated, not resolved.
- `pnpm parity:test --package actiondispatch` reports
  `route/definition/parser_test.rb` at 21/21, 0 extra.
- The `scanner_test.rb` row credits its Rails test. If the 26 loop siblings still
  score as `extra` because the extractor collapses the family to one row, that is
  a tooling gap: fix it in `scripts/test-compare/` with an all-package
  before/after showing no package's numbers rose, or file it as a follow-up and
  state the residual count in the PR body. Do not resolve it by flattening the
  loop back into 27 literals.
