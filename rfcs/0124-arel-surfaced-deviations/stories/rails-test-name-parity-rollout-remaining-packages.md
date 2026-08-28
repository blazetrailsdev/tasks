---
title: "lint: roll rails-test-name-parity out to the remaining packages"
status: done
updated: 2026-08-28
rfc: "0124-arel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 7163
claim: "2026-08-28T14:24:28Z"
assignee: "dot-visit-edge-error-drops-the-class-namespace"
blocked-by: null
closed-reason: null
---

## Context

`blazetrails/rails-test-name-parity` (PR #7131) is a per-`it()` only-shrink
ratchet. PR #7155 grew the enrollment from `arel` to `arel` + `date` — three
lists that must stay in sync:

- `PACKAGE_DIRS` in `scripts/build-rails-test-names-manifest.ts`
- `ENROLLED` in `scripts/tighten-rails-test-name-parity.ts`
- the rule's `files` block in `eslint.config.mjs`, plus the
  `Rails test-name parity ratchet` step in `.github/workflows/ci.yml`

`date` seeded at 7 TS-only tests across 5 files (its `parity:test` "extra"
count was 0, the smallest of any unenrolled package). The remaining packages,
with their `pnpm parity:test` extra (TS-only) counts as of 2026-08-28:

    did-you-mean    0      i18n            0
    abstractcontroller 37  globalid       48
    actionview      70     rack           93
    activemodel    106     trailties     122
    actioncontroller 345   actiondispatch 397
    activesupport  447     activerecord   955

## Converged shape

One PR per package, smallest first: add the package to the three lists and the
CI step, seed its mark with
`pnpm tsx scripts/tighten-rails-test-name-parity.ts --seed`, then burn the mark
down by moving each TS-only test into the file's `.trails.test.ts` twin (the
shape #7125 used for arel's 297). Enrollment is ONLY-GROW: a package joins once
seeded and is never removed to turn a red run green, and the mark is only ever
narrowed with `pnpm parity:test:names:tighten`.

## Acceptance criteria

- `did-you-mean` and `i18n` (both at 0 extra, so both seed to a hard `{}` like
  arel) join all four registrations.
- One story per remaining package is filed here for the seeded-then-burnt-down
  path, or this story is split into them.
- `pnpm parity:test` percentages unchanged; no test renamed.
