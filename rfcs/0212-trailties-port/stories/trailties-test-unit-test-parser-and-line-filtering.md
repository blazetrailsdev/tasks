---
title: "Port Rails::TestUnit test_parser and line_filtering"
status: in-progress
updated: 2026-11-01
rfc: "0212-trailties-port"
cluster: tt-surface
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: trails#9564
claim: "2026-11-01T03:07:56Z"
assignee: "trailties-mailers-controller"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/lib/rails/test_unit/test_parser.rb` (136 lines) is a `Ripper`
subclass (`:57`) that finds each test's line range, so that `file:line`
selects a test. `line_filtering.rb` (13) applies it. Neither has a TS file.
`test_unit/test_parser_test.rb` has 8 tests. This story is draft until the
RFC's open question 1 (what `rails test` drives) is answered.

## Acceptance criteria

- `TestParser.definition_for` / `ranges` keep their Rails names and read TS
  test files (`it(...)` / `test(...)` calls) through the compiler API. That is
  the language-forced deviation from `Ripper`, and it is receipted.
- `test_parser_test.rb` is ported against TS fixtures.
