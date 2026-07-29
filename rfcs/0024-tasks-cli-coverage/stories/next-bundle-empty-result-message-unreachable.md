---
title: "next-bundle's empty-result message is unreachable once any story is prioritized"
status: ready
updated: 2026-07-29
rfc: "0024-tasks-cli-coverage"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`next-bundle` prints `no ready stories within ${maxLoc} LOC` when the bundle
comes back empty (`scripts/tasks/cli.ts`, the `next-bundle` case in `main`).
That message is only reachable on the UNPRIORITIZED knapsack path: once any
in-scope candidate carries an effective priority, `nextBundle` takes the
prioritized branch and always returns `[lead, ...fill]`, so `rows.length === 0`
can never hold. With priorities set across the live index today, the branch is
effectively dead.

Surfaced while fixing the over-budget-lead banner (PR #5556, story
`next-bundle-prioritized-lead-busts-max-loc`). That PR deliberately left this
alone as out of scope — it changed only the over-budget reporting.

Two things worth settling:

- Whether the empty case is genuinely unreachable in every `--cluster` /
  `--rfc` filter combination, or only in the common one.
- Whether the message should still fire on the prioritized path when the
  filters select nothing at all (e.g. `--rfc <slug>` matching no ready
  stories), which today prints an empty bundle banner instead.

## Acceptance criteria

- [ ] Determine which filter combinations can actually produce an empty
      `nextBundle` result, and make the empty-result message fire (or be
      removed) accordingly — no silently dead branch.
- [ ] A filter selection that matches no ready stories reports that clearly
      rather than printing a bundle banner over zero rows.
- [ ] Cover the reachable empty cases in `scripts/tasks/cli.test.ts` alongside
      the existing `nextBundle` cases.
