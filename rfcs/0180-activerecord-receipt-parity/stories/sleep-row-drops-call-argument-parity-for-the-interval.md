---
title: "parity: a native-form row drops call-argument parity for its interval (sleep)"
status: draft
updated: 2026-10-07
rfc: "0180-activerecord-receipt-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8635 added a `sleep` row to `NATIVE_FORM_ANALOGUES`
(`scripts/api-compare/enumerable-idioms.ts`), crediting the one-shot suspension
`new Promise((resolve) => setTimeout(resolve, ms))` for a Ruby `Kernel#sleep`
(`rb_f_sleep`, `vendor/ruby/v3.3.11/process.c:5055`).

A native-form row drops the Ruby call from significance, and the
call-ARGUMENT gate (`pnpm parity:api:calls:args`, RFC 0095) reads the same
population — so the argument row goes with it. Nothing now compares the
interval a port passes against the one Rails sleeps for.

`AbstractAdapter#backoff`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:1079`)
is `sleep 0.1 * counter`; `packages/activerecord/src/connection-adapters/abstract-adapter.ts`
passes `0.1 * counter * 1000`, spelled that way so Rails' constant stays legible
at the one site that is now the only check on the unit. A port that passed
`0.1 * counter` milliseconds — 1000x too short — would be green.

Raised in review on trails#8635 (R1 #3), accepted there as a record of debt
rather than a blocker: the conversion itself is unavoidable under this
mechanism, since `Kernel#sleep` takes seconds and `setTimeout` takes
milliseconds. What is missing is the CHECK, not a different body.

The same gap applies to every future native-form row whose Ruby call carries a
meaningful argument; `sleep` is the first one where the argument is a quantity
rather than a receiver.

## Acceptance criteria

- [ ] A native-form row can declare that its Ruby call's argument is still
      compared, with a unit factor — `sleep`'s being seconds -> milliseconds —
      so `0.1 * counter` against `0.1 * counter * 1000` is green and
      `0.1 * counter` against `0.1 * counter` is red.
- [ ] `backoff`'s interval is covered by that check; a test pins the 1000x-short
      case as a failure.
- [ ] `pnpm parity:api:calls:args` green, with no baseline row added for
      `backoff`.
- [ ] If the factor cannot be expressed generally, the story is `tasks block`ed
      with the specific blocker — not closed by widening the row's reason text.
