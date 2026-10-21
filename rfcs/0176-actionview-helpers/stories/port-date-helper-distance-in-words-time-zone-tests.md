---
title: "port-date-helper-distance-in-words-time-zone-tests"
status: ready
updated: 2026-10-21
rfc: "0176-actionview-helpers"
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

`pnpm parity:test` (forced run, 2026-10-20) leaves
`template/date_helper_test.rb` at 228/231 — **3 missing**, the last of the
file: `distance in words with time zones`, `distance in words with different
time zones`, `distance in words with times`
(`vendor/rails/v8.0.2/actionview/test/template/date_helper_test.rb`).

The file also carries `assertionMismatches` and `kindMismatches`, so confirm
the three land as count- and kind-matched rather than as assertion debt.

`distance-of-time-in-words-computes-over-ruby-time`,
`distance-of-time-in-words-uses-i18n-not-local-defaults` and
`distance-of-time-in-words-drops-invented-defaults` are all `done`; these three
tests are the time-zone arm none of them took.

## Acceptance criteria

- The three tests exist in `template/date-helper.test.ts` at their Rails names
  and pass.
- `pnpm parity:test --package actionview` shows 0 missing for
  `date_helper_test.rb`, and the file's assertion-count/kind figures do not
  rise.
