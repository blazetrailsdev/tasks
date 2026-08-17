---
title: "parity:api excludes same-file-nested Rails classes from allRuby entirely"
status: ready
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`compare.ts:1321-1339` skips a class nested in a same-file parent by
`continue`-ing before `allRuby.push`, so the nested class is dropped from the
Rails-side population ENTIRELY — not merely from file pairing. Its methods
never enter the coverage denominator.

Confirmed during review of PR #5458 (which changed only extra-surface.ts's use
of the same rule). The consequence is that every method on a nested Rails class
is invisible to `parity:api`: unported ones do not count as missing, so the
"Data layer 98.8% / Overall 66.8%" headline silently excludes them.

The blast radius is the same population PR #5458 measured: 94 nested Ruby
classes repo-wide with a TS counterpart, plus however many nested classes have
NO TS counterpart at all — the latter are pure hidden gaps, since nothing on
either side accounts for them today.

## Acceptance criteria

- Quantify first: how many Ruby methods live on same-file-nested classes, and
  how many of those have a TS counterpart. Report the number before changing
  the denominator.
- Decide and document at the code site whether nested-class methods join
  `allRuby` (coverage becomes honest, totals move) or stay excluded for a
  stated reason.
- If they join, state the headline coverage delta in the PR body — these
  outputs feed the stats DB.
- Tests in `scripts/api-compare/compare.test.ts` pin the chosen rule.

## Re-verified 2026-08-17 (ready sweep)

Still open and worth prioritising: it is the one story here that moves the
headline parity number rather than a baseline row count. Re-verify the
`compare.ts` line range before starting — the file has moved considerably
(`significantMissingCalls` alone drifted from :245/:300 to :403), so
`:1321-1339` is almost certainly stale even though the behaviour is not.
