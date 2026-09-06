---
title: "Re-measure the arm noise floor per token after the extractor fixes"
status: in-progress
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: arm-parity-tooling
packages: []
deps:
  [
    "skeleton-emits-one-arm-per-when-elsif-and-rescue-clause",
    "skeleton-throw-token-carries-the-raised-class",
    "skeleton-short-circuit-operators-get-their-own-token",
    "arms-report-unions-same-file-helper-skeletons",
    "fold-skeleton-tokens-takes-an-idiom-lowering-table",
  ]
deps-rfc: []
est-loc: 120
priority: 3
pr: 7549
claim: "2026-09-06T00:58:51Z"
assignee: "remeasure-arm-noise-floor-per-token"
blocked-by: null
closed-reason: null
---

## Context

`measure-arm-mismatch-noise-floor` (done) drew ONE 80-row sample over the whole
mismatch population and classified it 37.5% real / 57.5% lowering artefact /
5.0% extraction bug, against a one-third tripwire committed in advance. The
tripwire fired and RFC 0113 runs ungated
(`docs/infrastructure/arm-mismatch-noise-floor.md`).

That number is a property of the population as projected THEN. Four
extractor stories change the projection —
`skeleton-emits-one-arm-per-when-elsif-and-rescue-clause`,
`skeleton-throw-token-carries-the-raised-class`,
`skeleton-short-circuit-operators-get-their-own-token`,
`fold-skeleton-tokens-takes-an-idiom-lowering-table` — plus the two already
`ready` (`ruby-logical-op-assign-emits-no-skeleton-arm`,
`skeleton-loop-fold-covers-only-each`). Between them they address every
artefact class the audit named except "Ruby-only guards" and "helper
delegation" (the latter has `arms-report-unions-same-file-helper-skeletons`).

The measurement was also never split by token. Today's report:

```text
Missing arms by token: if 598, throw 106, try 63, loop 62
Invented arms by token: if 6055, loop 573, throw 355, try 132
```

RFC 0113's Rollout Phase 5 ranks a missing `throw` above everything else, and
nothing in the audit says the 106 `-throw` rows share the `if` population's
artefact rate. A sub-population with a low measured rate can gate on its own
even though the whole cannot — RFC 0095 did exactly this by gating `shape`
rows and leaving `naming` rows report-only.

This story re-runs the measurement after the extractor stories land, stratified
by token, with the same seeded-sample discipline, and records the per-token
figures in the same doc. It does NOT seed a gate: if a stratum clears the
one-third tripwire, the gating decision is a separate story, filed from the
number, exactly as `seed-arm-parity-ratchet-or-record-ungated` was.

## Acceptance criteria

- [ ] `report-arms.ts --sample=N --seed=S` accepts `--token=throw|if|try|loop|rescue`
      and draws from the rows whose `missing`/`invented` include that token.
- [ ] `docs/infrastructure/arm-mismatch-noise-floor.md` gains a dated second
      measurement: the whole-population figure after the extractor fixes, and
      a per-token table for at least `-throw` (all 106-ish rows, since the
      stratum is small enough to read in full) and `if` (80-row sample).
- [ ] Each figure has its seed, sample size, and per-row verdict table, same
      format as the first measurement.
- [ ] The RFC README's open question 1 is updated with the new numbers, and a
      gating story is filed for any stratum under the tripwire — or the doc
      records that none was.
- [ ] Nothing gates in this story.
