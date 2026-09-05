---
title: "call-gate-credits-ruby-new-only-as-constructor"
status: draft
updated: 2026-09-05
rfc: "0025-fidelity-verification-tooling"
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

The call gates credit Ruby's `new` only as a TS `constructor` site:
`rubyMethodToTsWithoutUnderscore` returns `["constructor"]` for `new`
(`scripts/parity/conventions.ts:1539`), and `tsCallNameKeys`
(`scripts/api-compare/call-args.ts:851`) does the same, matching
`callSiteName`'s `new Foo(...)` → `"constructor"`
(`scripts/api-compare/extract-ts-api.ts:4418`).

That is right for every Rails class whose allocator is `new Foo(...)` in TS, and
wrong for the handful of MRI mirrors that keep Ruby's allocator as a static
named `new` — `@blazetrails/date`'s `Time.new` (`packages/date/src/time.ts:341`,
the port of `time_s_init`), which accepts the String/`in:` forms the TS
constructor cannot. A body that calls `Time.new(string, { in: "UTC" })` IS
spelling Rails' `::Time.new(string, in: "UTC")`
(`activemodel/lib/active_model/type/helpers/time_value.rb:76-98`), and the gate
reads it as an omitted call — the `@missingRailsCall` receipt on
`fastStringToTime` (`packages/activemodel/src/type/helpers/time-value.ts`).

Adding `"new"` as a second candidate in `conventions.ts` was tried in the PR
that landed that receipt and reverted: it also re-pairs call SEQUENCES, which
surfaced five unrelated `order:` and `new` rows in actiondispatch and
activerecord plus one stale rack row. The fix has to be scoped to the call-name
credit without moving sequence alignment, or it has to land together with those
rows.

## Acceptance criteria

- A TS call site literally named `new` credits a Ruby `new` call in both the
  call-set gate and the call-argument gate.
- `pnpm parity:api:calls` and `pnpm parity:api:calls:args` are non-negative,
  with any rows the re-pairing surfaces either converged or reviewed.
- The `@missingRailsCall new` receipt on `fastStringToTime` is deleted.
