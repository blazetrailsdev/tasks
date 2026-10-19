---
title: "ruby-assertion-extractor-counts-one-ruby-version-arm"
status: ready
updated: 2026-10-19
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

Two actiondispatch assertion rows in `dispatch/exception_wrapper_test.rb` are a comparer artefact. Rails' "#application_trace returns traces only from the application" (`vendor/rails/v8.0.2/actionpack/test/dispatch/exception_wrapper_test.rb:111-120`) and "#traces returns every trace by category enumerated with an index" (`:183-...`) each branch on `if RUBY_VERSION >= "3.4"` with one `assert_equal` per arm. Only one arm runs, but the Ruby assertion extractor (`scripts/test-compare/extract-ruby-tests.rb`) counts both, so Rails reads 2 `equal` and the faithful TS port (`packages/actionpack/src/action-dispatch/dispatch/exception-wrapper.test.ts:109-114,172-185`) reads 1.

## Acceptance criteria

- The Ruby assertion extractor counts a `RUBY_VERSION` (and similar runtime-version) `if`/`else` as one arm, the arm for the vendored Ruby version, or as the max of its arms.
- `pnpm parity:test --assertions --package actiondispatch` shows no `exception_wrapper_test.rb` row. The PR states the before/after for every package the change moves.
