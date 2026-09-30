---
title: "tooling: gate the missing if/loop/try/rescue arms per package once a package reaches zero"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: tooling
packages: ["activerecord"]
deps: ["audit-loop-try-rescue-arm-strata-for-gating"]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Only the `throw` arm is gated (`lint-arm-throws.ts`); `if`/`loop`/`try`/`rescue` and the 1,801
short-circuit (`or`/`and`) mismatches are report-only, so a package burned to zero can regress
silently. `audit-loop-try-rescue-arm-strata-for-gating` (RFC 0127) measures the noise floor; this story
turns the missing-direction count into a per-package only-shrink mark the moment a package reaches 0
(arel and activemodel first), mirroring `arm-throw-mark.json`.

## Acceptance criteria

- [ ] A missing-arm mark (all four tokens) gates enrolled packages, with `--tighten` and no reseed, and tests.
- [ ] arel and activemodel are enrolled at 0 once their missing-arm stories land; activerecord joins at 0 last.
