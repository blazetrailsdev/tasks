---
title: "Move TS-only BacktraceCleanerKindTest into backtrace-cleaner.trails.test.ts"
status: draft
updated: 2026-10-21
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
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

`packages/activesupport/src/backtrace-cleaner.test.ts`'s `describe("BacktraceCleanerKindTest")` (around :144-196) holds eight TS-only tests (`clean with :silent ...`, `cleanFrame default ...`, `cleanFrame with :noise ...`, `cleanFrame with :all ...`). None of them has a counterpart in `vendor/rails/v8.0.2/activesupport/test/backtrace_cleaner_test.rb`, which defines no `BacktraceCleanerKindTest` class. Because they sit in the convention file, they raise its `extra` count in `parity:test`. trails#9168 put its new TS-only test in `backtrace-cleaner.trails.test.ts`, and the PR review flagged the existing ones.

## Acceptance criteria

- Move the `BacktraceCleanerKindTest` describe block, keeping its test names unchanged, into `packages/activesupport/src/backtrace-cleaner.trails.test.ts`.
- `parity:test` shows the convention file's extra count going down, and no matched test is lost.
