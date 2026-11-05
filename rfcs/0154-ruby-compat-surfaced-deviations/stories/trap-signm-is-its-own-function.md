---
title: "ruby-compat trap calls a separate trapSignm, as sig_trap calls trap_signm"
status: in-progress
updated: 2026-11-05
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#9727
claim: "2026-11-05T02:35:22Z"
assignee: "trap-signm-is-its-own-function"
blocked-by: null
closed-reason: null
---

## Context

MRI parses `trap`'s signal argument in a separate static function, `trap_signm` (`vendor/ruby/v3.3.11/signal.c:1230-1243`), which `sig_trap` calls (`signal.c:1348-1356`). trails#9727 inlined that parsing into ruby-compat's `trap` (`packages/ruby-compat/src/process-adapter.ts`). A module-private `trapSignm` raised ruby-compat's `internal` extra-surface count above its only-shrink mark (808 → 809, `scripts/api-compare/extra-surface-mark.json`).

## Acceptance criteria

- [ ] `trapSignm(vsig)` is its own function in `process-adapter.ts`, mirroring `trap_signm`: number range check (`invalid signal number (%d)`), then `signm2signo` for names. `trap` calls it as `sig_trap` does.
- [ ] Room in ruby-compat's `internal` mark comes from converging or deleting another internal name in the same PR, not from raising the mark.
- [ ] `pnpm parity:api:extra:gate` stays green.
