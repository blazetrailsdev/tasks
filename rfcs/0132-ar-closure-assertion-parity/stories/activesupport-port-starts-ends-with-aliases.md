---
title: "Port String/Symbol starts_with?/ends_with? varargs aliases"
status: in-progress
updated: 2026-09-16
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 2
pr: trails#7828
claim: "2026-09-16T02:17:04Z"
assignee: "expects-canonical-kind-enrollment"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activesupport/lib/active_support/core_ext/symbol/starts_ends_with.rb:3-6`
aliases `Symbol#starts_with?`/`#ends_with?` to Ruby's varargs `start_with?`/`end_with?`;
`core_ext/string/starts_ends_with.rb` does the same for String. trails ports neither
(no `startsWith`/`endsWith` varargs export under `packages/activesupport/src/core-ext/`).
As a result `packages/activesupport/src/core-ext/symbol-ext.test.ts` (PR trails#7810)
exercises inline `prefixes.some(...)` closures instead of trails source, and
`string_ext_test.rb › starts ends with alias` is unconverged for the same reason.

Converged shape: this-less functions `startsWith(str, ...prefixes)` / `endsWith(str, ...suffixes)`
in `core-ext/string/starts-ends-with.ts` (a Ruby Symbol is a JS string, so one port
serves both), and both tests call them.

## Acceptance criteria

- `startsWith`/`endsWith` ported at the convention path for `starts_ends_with.rb`, credited by `parity:api`.
- `symbol-ext.test.ts` and string-ext `starts ends with alias` call the port; assertion parity stays 0/0/0.

## LOC limit

**The per-PR LOC limit is LIFTED for RFC 0132.** Stories here may ship as large
a PR as the work honestly needs; do not split a file's burndown, restructure a
test, or leave a remainder unconverged merely to fit a line budget. Every other
constraint (no test renames, mark file only-shrink, no name-gate regression)
still applies.
