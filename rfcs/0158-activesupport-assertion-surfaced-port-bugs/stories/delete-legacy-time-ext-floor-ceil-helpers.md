---
title: "Delete legacy Date floor/ceil ms helpers in activesupport time-ext.ts"
status: in-progress
updated: 2026-09-25
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8079
claim: "2026-09-25T03:24:24Z"
assignee: "activesupport-assert-match-drops-respond-to-and-last-match"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/time-ext.ts:432-444` exports `floor(date: Date, ms)` and
`ceil(date: Date, ms)`, trails-only millisecond-bucket helpers with no Rails or MRI
counterpart. Ruby's `Time#floor(ndigits)` / `Time#ceil(ndigits)` (`vendor/ruby/time.c:4595`,
`:4640`) were ported onto `packages/date` `Time` in trails#8054, and the Rails
`test_floor` / `test_ceil` (`activesupport/test/core_ext/time_ext_test.rb:128-149`)
now exercise that port.

The helpers survive only through `packages/activesupport/src/time-ext.test.ts:387-408`,
a trails-invented test of their own `RangeError` guards, and through the
`export * from "./time-ext.js"` barrel in `packages/activesupport/src/index.ts:367`.

## Acceptance criteria

- `floor` / `ceil` are deleted from `time-ext.ts`, with the `time-ext.test.ts` cases that
  test only them.
- No package imports them (`git grep` confirms), and `pnpm typecheck` stays green.
