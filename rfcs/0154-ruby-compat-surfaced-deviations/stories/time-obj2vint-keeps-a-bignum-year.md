---
title: "time-obj2vint-keeps-a-bignum-year"
status: draft
updated: 2026-11-26
rfc: "0154-ruby-compat-surfaced-deviations"
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

Split from `kernel-integer-bignum-callers-narrow-with-number`. MRI's `obj2vint`
(`vendor/ruby/v3.3.11/time.c:3047-3058`) keeps a Bignum year: `vtm.year` is a
VALUE (`time.c:2470`, `:3182`), so `Time.utc(2**64)` is a valid Time.

`packages/date/lib/time.ts` `obj2vint` (`:181-184`) answers
`Number(kernelInteger(obj, 10))`, and the year it returns feeds
`globalThis.Date#setUTCFullYear` in the constructor (`:1465-1489`), which
cannot hold a year past ±275760. trails also calls `obj2vint` for month, day,
hour and min, where MRI uses `obj2ubits(obj2int(...))`.

## Acceptance criteria

- [ ] `obj2vint` answers `number | bigint` with no `Number(...)` narrowing, and
      is called for the year only; month/day/hour/min go through `obj2int` /
      `obj2ubits` as MRI has them.
- [ ] A year outside the JS `Date` range either carries through the vtm
      (`Time.utc(2**64).year` is the bigint) or the limit is ratified by the
      operator under CLAUDE.md "Runtime facts Node does not expose".
