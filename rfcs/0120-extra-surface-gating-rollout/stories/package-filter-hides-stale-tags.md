---
title: "parity:api:extra --package hides stale @noRailsEquivalent tags in every other package"
status: draft
updated: 2026-09-03
rfc: "0120-extra-surface-gating-rollout"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:extra --package <pkg>` filters the whole report, including the
STALE `@noRailsEquivalent` block (`scripts/api-compare/extra-surface.ts`, the
`filterPkg` threaded into `buildReport`). CI's `Extra-surface tag gates` step
runs it UNFILTERED (`pnpm exec tsx scripts/api-compare/extra-surface.ts`), so a
change to the shared scoring logic can be locally green in the package you are
working in and red in CI for every other package.

Observed on #7425. Making the `synthesizedFileModule` exemption unconditional
(the container name minted from the TS file path, `extract-ts-api.ts:1233`)
retired every file-level tag whose only covered name was that container. Ten
were in activerecord and were caught locally; twelve more were in `activemodel`
(`type/internal/sentinels.ts`) and `ruby-compat` (`kernel-float`, `kernel-rand`,
`method-missing-proxy`, `rb-equal`, `rb-hash`, `ruby-empty`, `verbose`,
`string/{chomp,inspect,succ,force-encoding}`) and surfaced only as
`extra-surface: 12 STALE @noRailsEquivalent tag(s)` in CI, costing a full round.

The stale-tag report is a whole-repo invariant, not a per-package measurement:
a tag is stale or it is not, regardless of which package the reader asked about.
Filtering it is what makes the local run and the CI run disagree.

## Acceptance criteria

- The STALE `@noRailsEquivalent` block is reported regardless of `--package`,
  or the filtered run prints an explicit line saying the stale-tag check was
  scoped and naming the unfiltered command that gates it.
- A test in `scripts/api-compare/extra-surface.test.ts` pins it: a stale tag in
  package B is reported (or announced) by a run filtered to package A.
- Verified by re-running the #7425 scenario: with the exemption change applied
  and `--package activerecord`, the twelve activemodel/ruby-compat tags are
  visible locally.
