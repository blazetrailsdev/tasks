---
title: "Compose the arms report's --token filter with --direction"
status: blocked
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 2
pr: null
claim: null
assignee: null
blocked-by: "The --token= flag this story composes with does not exist on origin/main: scripts/api-compare/report-arms.ts#parseFilter reads only --direction= and --package= (:549-563), and PR #7549, which wrote --token=, is CLOSED unmerged (branch origin/remeasure-arm-noise-floor-per-token-9adb). There is nothing to compose until seed-a-missing-throw-arm-ratchet lands the flag, which is one of its acceptance criteria. Unblocks on that story."
closed-reason: null
---

## Context

`arms-report-direction-and-package-strata` (PR #7550, merged as 6c4ac194d) added
`--direction=missing|invented` and `--package=<name>` to
`scripts/api-compare/report-arms.ts`, via `ArmRowFilter` / `filterRows` /
`parseFilter`. Its acceptance criteria specified the direction filter as
"`missing` keeps rows whose `missing` is non-empty (**with `--token=T`, whose
`missing` names `T`**)".

That parenthetical could not be honoured: the `--token=T` flag comes from the
sibling story `remeasure-arm-noise-floor-per-token` (PR #7549), which was still
open when #7550 landed. Stacking is forbidden, so #7550 shipped the direction
filter standalone and said so in its PR body.

The two are independent predicates over the same `ArmMismatch` row, so composing
them is small — but it is not free: `--token=T` today draws from rows whose
`missing` OR `invented` names `T`, and the composed reading has to narrow that
OR to the named direction rather than intersecting two independent filters.

## Acceptance criteria

- [ ] `--token=T` is folded into `ArmRowFilter` alongside `direction` and
      `package`, so one predicate decides a row and `parseFilter` reads all three.
- [ ] With `--direction=missing --token=T`, a row is kept only when its `missing`
      names `T`; `--direction=invented --token=T` is the mirror; `--token=T`
      alone keeps the existing OR reading.
- [ ] The sample header names the token stratum alongside the direction and
      package it already names.
- [ ] Unit tests in `report-arms.test.ts` pin all three combinations.
- [ ] `docs/infrastructure/arm-mismatch-noise-floor.md`'s "Reproducing" section
      shows the composed invocation.
- [ ] Nothing gates; the report stays report-only.

## Notes

No Rails counterpart — `scripts/api-compare/**` is repo-local parity tooling.
