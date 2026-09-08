---
title: "Journey gtg transition-table and builder test parity"
status: done
updated: 2026-09-08
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: ["actionpack"]
deps: ["journey-test-names-to-rails-def-test-form"]
deps-rfc: []
est-loc: 250
priority: null
pr: 7608
claim: "2026-09-08T12:31:44Z"
assignee: "journey-gtg-test-parity"
blocked-by: null
closed-reason: null
---

## Context

Two sibling files, both credited almost entirely by the re-spelling story:

- `vendor/rails/actionpack/test/journey/gtg/builder_test.rb` — 6 tests, all 6
  re-spelled, 0 trails-only. Nothing should remain after the re-spelling; this
  story verifies that and converges the assertions.
- `vendor/rails/actionpack/test/journey/gtg/transition_table_test.rb` — 8 tests,
  7 re-spelled, 1 absent, 4 trails-only in
  `packages/actionpack/src/action-dispatch/journey/gtg/transition-table.test.ts`.
  Rails' list: `to json`, `to svg`, `simulate gt`, `simulate gt regexp`,
  `simulate gt regexp mix`, `simulate optional`, `match data`, `match data
ambiguous`.

## Acceptance criteria

- The one absent `transition_table_test.rb` test is ported from the Ruby.
- The 4 trails-only tests move to a `journey/gtg/transition-table.trails.test.ts`
  sibling.
- `pnpm parity:test --package actiondispatch` reports `gtg/builder_test.rb` at
  6/6 and `gtg/transition_table_test.rb` at 8/8, both 0 extra.
- Assertion mismatches on the 14 pairs are converged, not marked.
