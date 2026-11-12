---
title: "ActiveSupport callbacks and cache store await their promises instead of pre-observing them"
status: draft
updated: 2026-11-12
rfc: "0000-no-void-promises"
cluster: discarded-calls
packages: [activesupport]
deps: [no-floating-promises-repo-wide-ignore-void-false, no-swallowed-rejection-lint-rule]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § Design 1, "pre-observe now, await later". `callbacks.ts:67,599`
and `:1021-1043` attach empty handlers to promises that later code awaits
(`:1315,1344,1348`), to keep an early rejection from being reported as
unhandled. Also `cache/store.ts:228`, `time-with-zone.ts:868,870` (check
whether these are promises). Rails:
`vendor/rails/v8.0.2/activesupport/lib/active_support/callbacks.rb`.

## Acceptance criteria

- [ ] Each pre-observed promise is awaited in order or combined with an awaited `Promise.allSettled`, with rejections re-raised in Rails' order.
- [ ] The full callbacks test files pass on all three adapters' AR callback suites (CI).
- [ ] activesupport's source marks reach 0.

## Definition of done

An `eslint-disable`, a receipt tag, or a raised mark does not close this story.
