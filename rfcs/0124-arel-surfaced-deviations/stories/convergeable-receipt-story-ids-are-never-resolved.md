---
title: "gate: a CONVERGEABLE receipt's story id is never checked against the tasks DB"
status: draft
updated: 2026-08-28
rfc: "0124-arel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

After PR #7163 there are ~114 `@noRailsEquivalent` / `@missingRailsCall` /
`@missingRailsArgs` receipts whose `CONVERGEABLE` claim names a story id, and
`parity:api:reasons` (`scripts/api-compare/lint-missing-rails-call-reasons.ts`,
`lintBareConvergeable`) now enforces that a story id is PRESENT. Nothing checks
that the id RESOLVES: a typo, a renamed slug, or a story that has since been
closed all read as a valid receipt.

`scripts/stale-story-references.ts` is the nearest existing check, but it only
matches a slug sitting in the same comment sentence as a forward-looking phrase
("converged by", "once X lands", …). A receipt carries no prose by
construction — `PERMANENT` and `CONVERGEABLE <story-id>` are the only two
shapes `no-freeform-comments` permits — so every one of them is invisible to it.

## Converged shape

Extend `parity:api:reasons` (or `stale-story-references.ts`, whichever owns the
tasks-DB read) to resolve each `CONVERGEABLE <story-id>` against the tasks
checkout, failing on an id that names no story. A closed or done story is the
same signal `stale-story-references.ts` already treats as stale: the receipt
outlived its convergence and should have come off with it.

## Acceptance criteria

- A receipt naming a non-existent story id fails the check, with the file:line
  and the id.
- A receipt naming a `done`/`closed` story is reported the way
  `stale-story-references.ts` reports a landed story with a pending citation.
- The check no-ops (rather than failing) where no tasks checkout is reachable,
  as the private-methods manifest lints already do.
- Unit tests cover: resolving id, missing id, closed id, no-tasks-checkout.
