---
title: "Arms report: --direction and --package filters, and a per-package token table"
status: done
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: arm-parity-tooling
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: 3
pr: 7550
claim: "2026-09-06T11:48:11Z"
assignee: "arms-report-direction-and-package-strata"
blocked-by: null
closed-reason: null
---

## Context

The per-token re-measurement (`remeasure-arm-noise-floor-per-token`, PR #7549)
found that the direction of a mismatch predicts its realness better than its
token does: the missing-`throw` stratum was 88% real read in full, while the
`if` stratum — 88% of all rows, dominated by INVENTED `if`s from `??`
defaults, memos and duck-typed guards — is the noise floor. RFC 0113 gates
nothing on the report, so the report's job is to hand a burndown story the
rows worth reading. Today it cannot hand over the two slices that matter.

`report-arms.ts` after PR #7549 (`scripts/api-compare/report-arms.ts`):

- `--sample=N --seed=S --token=T` (`:467` onward) draws from rows whose
  `missing` OR `invented` names `T`. There is no way to ask for the missing
  direction alone; the doc had to say "no flag narrows to one direction" and
  the 69 `-throw` rows were picked out by hand.
- `renderReport` (`:318`) tallies by verdict, cluster, package, file and token
  over the WHOLE artifact. A package's own token table — the question "how
  many activerecord rows drop an arm and invent none?" — needs a hand script.
  Run on `main` at e199e63b4, that script gave:

```text
package       pairs  mismatched  pure-missing  missing-throw  raise-class
activerecord   2844   1102 (39%)          145             36           12
activemodel     247     87 (35%)            6              1            1
arel            329     43 (13%)            8              1            0
```

The 145 activerecord "pure-missing" rows (arms dropped, none invented, so the
port-added-a-guard artefact cannot apply) are the highest-yield slice in the
repo and the report cannot name them.

Sibling: `seed-a-missing-throw-arm-ratchet` gates the `-throw` stratum. That
story reads the same `missing` list this one filters on; the two do not
overlap in code, and this one stays report-only.

## Acceptance criteria

- [ ] `--sample` accepts `--direction=missing|invented`; `missing` keeps rows
      whose `missing` is non-empty (with `--token=T`, whose `missing` names
      `T`), `invented` the mirror. Without the flag behaviour is unchanged.
- [ ] `--sample` and `--report` accept `--package=<name>`, restricting every
      tally and draw to that package's rows.
- [ ] `--report` gains a "Missing-only rows by package" tally — rows with a
      non-empty `missing` and an empty `invented` — and a per-package token
      table (missing-tokens / invented-tokens / rows-with-missing /
      rows-with-invented per control token) for each package, in the shape
      above.
- [ ] The sample header names the direction and package it drew from, as it
      names the token stratum today.
- [ ] Unit tests in `report-arms.test.ts` pin: direction filtering in both
      directions, `--package` restricting the draw, and the missing-only tally.
- [ ] `docs/infrastructure/arm-mismatch-noise-floor.md`'s "Reproducing"
      section lists the new flags; the RFC README is not changed.
- [ ] Nothing gates.
