---
title: "TS assertion extractor counts one RUBY_VERSION arm, as the Ruby extractor does"
status: draft
updated: 2026-10-19
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ruby-assertion-extractor-counts-one-ruby-version-arm` (trails#9053) made the
Ruby assertion extractor count an `if RUBY_VERSION >= "3.4"` / `else` as one
arm. The TS extractor still counts both arms of the mirrored
`if (RUBY_VERSION >= "3.4")` branch, so a faithful port reads more assertions
than Rails.

Live row after the actionpack closing sweep: `dispatch/debug_exceptions_test.rb`
"logs exception causes" (`vendor/rails/v8.0.2/actionpack/test/dispatch/debug_exceptions_test.rb:630-680`)
is rails 8 / trails 13 (count) with `includes` 4/6 and `match` 3/6 (kind). The
TS port is `packages/actionpack/src/action-dispatch/dispatch/debug-exceptions.test.ts:746-800`,
and both arms mirror Rails line for line.

## Acceptance criteria

- The TS assertion extractor (`scripts/test-compare/`) counts a `RUBY_VERSION` `if`/`else` the same way the Ruby extractor does.
- `pnpm parity:test --assertions --package actiondispatch` shows no `debug_exceptions_test.rb` count or kind row, and the PR states the before/after for every package the change moves.
