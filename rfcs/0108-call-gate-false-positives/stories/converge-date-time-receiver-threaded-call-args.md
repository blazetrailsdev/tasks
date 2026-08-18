---
title: "converge-date-time-receiver-threaded-call-args"
status: done
updated: 2026-08-18
rfc: "0108-call-gate-false-positives"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6681
claim: "2026-08-18T00:47:59Z"
assignee: "converge-date-time-receiver-threaded-call-args"
blocked-by: null
closed-reason: null
---

# Converge the DateAndTime::Calculations receiver-threaded call sites

## Context

The call-argument gate fix in `call-args-gate-skips-twice-declared-bodies`
(PR TBD) made `checkCallArgs` consult the owner-scoped call sites instead of
requiring exactly one whole-file declaration, which surfaced 93 pre-existing
`kind: "args"` rows. 65 of them are one class, all baselined together in
`scripts/api-compare/call-mismatches-exclude/activesupport/core-ext/date*/` and
`activesupport/time-ext.json`:

`DateAndTime::Calculations`
(`vendor/rails/activesupport/lib/active_support/core_ext/date_and_time/calculations.rb`)
is a module mixed into `Date`, `Time` and `DateTime`, so every internal call is
receiverless — `to_date`, `wday`, `advance(days: 1)`, `beginning_of_week`. The
port (`packages/activesupport/src/core-ext/date-and-time/calculations.ts`) is a
set of free functions taking the receiver as an explicit first parameter,
`dateOrTime: DateOrTime`, so every site reads `toDate(dateOrTime)` against
Ruby's `to_date`.

The comparator already has the mechanism for exactly this: `stripCalleeReceiverArg`
(`scripts/api-compare/call-args.ts:571`) drops a leading explicit-receiver
argument when the Ruby call is receiverless and the callee's parameter is a
receiver by `isReceiverParam` (`scripts/api-compare/arity.ts:146`). It does not
fire here because neither the type `DateOrTime` is in `HOST_PARAM_TYPES` nor the
name `dateOrTime` in `RECEIVER_PARAM_NAMES` (both `arity.ts:34,83`).

Measured on the PR branch: adding `"DateOrTime"` to `HOST_PARAM_TYPES` alone
drops the surfaced rows from 98 to 64 and raises arity from 8318/8417 to
8322/8417, with no stale baseline rows. It was left out of that PR because
`HOST_PARAM_TYPES` also feeds the arity check and the change belongs with its
own review.

## Acceptance criteria

- [ ] The receiver-threaded date/time rows compare rather than baseline —
      either by teaching `isReceiverParam` the `DateOrTime` receiver, or by the
      `RECEIVER_AS_FIRST_ARG` route if the table's Object/String/Array/Hash
      boundary is deliberately widened to the Date/Time core-exts.
- [ ] Every row the change retires is DELETED from its
      `call-mismatches-exclude` shard by hand (only-shrink; no reseed).
- [ ] `pnpm parity:api:calls`, `pnpm parity:api:calls:args` and the arity gate
      stay green.
