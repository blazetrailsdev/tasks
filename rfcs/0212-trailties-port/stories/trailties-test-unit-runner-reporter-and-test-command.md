---
title: "Port Rails::TestUnit::Runner, Reporter and the test command"
status: ready
updated: 2026-11-01
rfc: "0212-trailties-port"
cluster: tt-surface
packages: ["trailties"]
deps: ["trailties-test-unit-test-parser-and-line-filtering"]
deps-rfc: []
est-loc: 650
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/lib/rails/test_unit/runner.rb` (214 lines), `reporter.rb`
(121) and `vendor/rails/v8.0.2/railties/lib/rails/commands/test/test_command.rb` (79) have no
TS files (0/21, 0/24, 0/17). RFC 0142 holds
`trails-test-command-ports-test-command` (draft), which RFC 0171 references.
Coordinate with it, or close one of the two as a duplicate. This story is draft until the RFC's open
question 1 is answered.

## Acceptance criteria

- `trails test [paths] [-n pattern]` runs the selected tests through the
  chosen backend, with `Runner`'s `parse_options`, `load_tests`,
  `compose_filter` and `extract_filters` at their Rails names.
- `test_unit/reporter_test.rb` (17) is ported as far as the backend allows.
  Each skip cites the ruling.
