---
title: "did-you-mean: pin did_you_mean.rb and null_checker.rb bodies (6 unpinned)"
status: claimed
updated: 2026-10-20
rfc: "0193-small-gem-ports-parity-100"
cluster: small-residuals
packages: ["did-you-mean"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-10-20T15:54:00Z"
assignee: "did-you-mean-pin-registry-and-null-checker-bodies"
blocked-by: null
closed-reason: null
---

## Context

Measured on trails `main` @ `5c642754f3` (2026-10-20): did-you-mean reports `pins: 10/16 (6 unpinned)`. The RFC's Verification requires 0 unpinned. The unpinned pairs came in with `did-you-mean-top-level-spell-checkers-registry`:

- `did_you_mean.rb` (4): `[]=`, `merge!`, `spell_checkers`, `correct_error`
- `spell_checkers/null_checker.rb` (2): `initialize`, `corrections`

## Acceptance criteria

- [ ] Each pair read against its vendored did_you_mean body, converged where it diverges, then pinned with `tsx scripts/api-compare/body-pins.ts --pin <ruby-file>`.
- [ ] A forced `pnpm parity:api` reports did-you-mean `pins: 16/16 (0 unpinned)`.
