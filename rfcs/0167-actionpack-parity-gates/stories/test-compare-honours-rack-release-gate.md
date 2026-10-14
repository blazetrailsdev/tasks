---
title: "test-compare-honours-rack-release-gate"
status: draft
updated: 2026-10-14
rfc: "0167-actionpack-parity-gates"
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

Two Rails tests sit inside a Rack-version gate and do not exist under trails'
vendored Rack 3.1.14:

- `vendor/rails/v8.0.2/actionpack/test/dispatch/param_builder_test.rb:24`
  (`if ::Rack::RELEASE.start_with?("2.")`) — "(rack 2) defaults to ignoring leading bracket"
- `vendor/rails/v8.0.2/actionpack/test/dispatch/query_parser_test.rb:26`
  (same gate) — "(rack 2) defaults to mixed separators"

`pnpm parity:test --package actiondispatch` still counts both as Miss for
`dispatch/param_builder_test.rb` and `dispatch/query_parser_test.rb`: the
test-compare Ruby extractor does not read a `::Rack::RELEASE.start_with?` gate.
Surfaced by move-misplaced-http-tests-to-dispatch-convention (RFC 0164).

## Acceptance criteria

- The Ruby extractor (`scripts/test-compare/`) treats a test under
  `if ::Rack::RELEASE.start_with?("2.")` as feature-gated for trails' Rack 3,
  dropping it from the denominator rather than reporting it missing.
- Both rows above report 0 Miss with no test ported.
