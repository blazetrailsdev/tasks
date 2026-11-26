---
title: "signal-exception-esignal-init-integer-arm"
status: in-progress
updated: 2026-11-26
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10786
claim: "2026-11-26T02:59:51Z"
assignee: "kernel-integer-bignum-callers-narrow-with-number"
blocked-by: null
closed-reason: null
---

## Context

Rake raises `SignalException.new(status.termsig)` with an Integer (`vendor/rake/v13.2.1/lib/rake/testtask.rb:119`). MRI's `esignal_init` takes that Integer through `rb_check_to_integer` and names it `SIG` plus its `siglist` name, or `SIG%u` when there is none (`vendor/ruby/v3.3.11/signal.c:330-360`).

trails#10407 first ported that arm as a `SignalException` constructor in `packages/ruby-compat/lib/signal-exception.ts`. The extra-surface ratchet (`scripts/api-compare/lint-extra-surface-ratchet.ts`) then reported `ruby-compat total: mark 51 → current 52` and `noCounterpartFiles: mark 14 → current 15`, because `signal-exception.ts` maps onto no Ruby file. The conversion was moved into rake's raise site, `packages/rake/lib/testtask.ts`, where it is receipted `@inventedArm signo2signm`.

## Acceptance criteria

- `SignalException`'s constructor takes `string | number` and ports `esignal_init`'s number arm (`signal.c:345-360`), including the `SIG%u` fallback.
- rake's raise site is `new SignalException(status.termsig()!)`, as `testtask.rb:119` has it, with no `@inventedArm`.
- The extra-surface gate stays green. The way to get there is to map `signal-exception.ts` onto MRI's `signal.c` for the scorer, or something equivalent, not to raise the mark.
