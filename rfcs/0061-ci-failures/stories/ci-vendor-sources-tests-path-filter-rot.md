---
title: "Guard vendor sources tests against silent rot under CI path filtering"
status: draft
updated: 2026-07-26
rfc: "0061-ci-failures"
cluster: null
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

# Guard vendor/\*.test.ts against silent rot under CI path filtering

## Context

PR #5347 found four assertions in `vendor/sources.test.ts` that had been
failing ever since wave 3.5 (#1621) added `actionpackversion` to
`vendor/sources.ts` and gave `abstractcontroller` a `testPath` without
updating the expectations. Nobody noticed because CI's changed-path filter
(`.github/workflows/ci.yml`, tooling-only detection around line 220) only
runs the `other` vitest project (which includes `vendor/*.test.ts`, see
`vitest.config.ts:415`) when relevant paths change — and nothing under
`vendor/` changed for months. Any exact-set expectation over SOURCES rots the
moment a source is added via a PR that doesn't touch `vendor/`... except
sources can only be added by editing `vendor/sources.ts`, which IS under
`vendor/` — the actual rot vector was #1621 editing `vendor/sources.ts` while
CI was green: the failures predate the filter or were merged red. Either way
the guard is the same.

## Acceptance criteria

- CI runs the `other` project (or at minimum `vendor/*.test.ts` +
  `scripts/api-compare/*.test.ts`) whenever `vendor/sources.ts`,
  `vendor/sources.lock.json`, or `vendor/fetch.ts` change, and on the default
  branch's full runs.
- Demonstrate the guard: a deliberate expectation drift in a scratch branch
  fails CI.
