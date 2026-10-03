---
title: "parity: the call-argument gate aligns the receiver of function-form max"
status: in-progress
updated: 2026-10-03
rfc: "0179-api-compare-crediting-rules"
cluster: call-args
packages: []
deps:
  - call-args-gate-aligns-the-receiver-of-a-function-form-hash-merge
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8432
claim: "2026-10-03T01:25:21Z"
assignee: "call-args-gate-aligns-the-receiver-of-function-form-fetch-and-max"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-relation-part-1` audit. The `fetch` half of
this story landed with `call-args-gate-aligns-the-receiver-of-a-function-form-hash-merge`
(trails#8426): `alignBuiltinReceiver` (`scripts/api-compare/call-args.ts`) aligns a function-form
call whose callee is the `RECEIVER_KEYED_RUBY_COMPAT_EXPORTS` port of the Ruby name, which covers
`Hash#fetch`, and every `@missingRailsArgs fetch` receipt is gone. What remains is `max`.

`packages/activerecord/src/relation.ts` `computeCacheVersion` calls ruby-compat's
`max(records.map(…))` (`packages/ruby-compat/src/comparable.ts`, `vendor/ruby/v3.3.11/array.c:5848`)
where `vendor/rails/v8.0.2/activerecord/lib/active_record/relation.rb:478` calls
`records.map { … }.max`, so the comparator reads the Ruby receiver as an extra leading TS argument
(Ruby none, TS `ref:map`). It carries `@missingRailsArgs max — CONVERGEABLE` onto this story.

`max` is a Ruby core built-in no Rails class defines, so it qualifies for
`scripts/api-compare/receiver-as-first-arg.ts`'s `RECEIVER_AS_FIRST_ARG` by the table's own rule
(it already holds `min`).

The same receipt is `PERMANENT` in `packages/trailties/src/thor/shell/column-printer.ts` and
`table-printer.ts`, which is the population this closes.

## Acceptance criteria

- [ ] `max` is in `RECEIVER_AS_FIRST_ARG`, with a `call-args.test.ts` case for `max(records.map(…))` against `records.map { … }.max`.
- [ ] The `relation.ts` receipt is deleted and `pnpm parity:api:calls:args` is green with no baseline row added.
- [ ] Every other `@missingRailsArgs max` receipt the alignment clears is deleted; any that survive are listed in the PR body with the reason.

## Verification

```bash
pnpm vitest run scripts/api-compare/call-args.test.ts && API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api:calls:args
```
