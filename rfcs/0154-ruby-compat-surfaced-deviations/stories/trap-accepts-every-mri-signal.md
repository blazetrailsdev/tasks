---
title: "ruby-compat trap accepts every signal MRI's trap_signm does"
status: done
updated: 2026-11-05
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#9727
claim: "2026-11-05T02:35:19Z"
assignee: "trap-accepts-every-mri-signal"
blocked-by: null
closed-reason: null
---

## Context

trails#9727 added ruby-compat's `trap` (`packages/ruby-compat/src/process-adapter.ts`), the port of MRI's `sig_trap` (`vendor/ruby/v3.3.11/signal.c:1348`). `trap_signm` (`signal.c:1230-1243`) accepts any signal number below the platform `NSIG`, and `signm2signo` accepts every name in `siglist`, including `EXIT` / `0` (`signal.c:1334-1336`). The port accepts only INT, TERM and QUIT (the signals `ProcessAdapter#onSignal`'s `SignalName` can listen for), and bounds numbers with a hardcoded `65` instead of `NSIG`.

## Acceptance criteria

- [ ] `trap("EXIT", cmd)` / `trap(0, cmd)` installs an at-exit handler, as MRI does (`signal.c:1334-1336`).
- [ ] Every signal Node's `process.on` can listen for is accepted by name, with or without `SIG`, and by number, through `ProcessAdapter` (widening `SignalName`).
- [ ] The number bound comes from the platform's signal table, not a literal `65`.
- [ ] Reserved signals raise "can't trap reserved signal: SIG%s" (`signal.c:1356-1362`).
