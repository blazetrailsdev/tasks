---
title: "Nothing re-checks a blocked story's named PR; 8 of 19 were stale"
status: ready
updated: 2026-08-07
rfc: "0091-tasks-backlog-integrity"
cluster: null
deps: []
deps-rfc: []
est-loc: 130
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

A `blocked` story's `blocked-by` frequently names the PR it waits on, e.g.
"Depends on PR #6128 (abstract-adapter-pool-is-typed-unknown), still open …
Unblock once #6128 merges." Nothing ever re-checks that PR. The story stays
`blocked` until a human sweeps the backlog, and a `blocked` story is invisible
to `pnpm tasks ready` / `next-bundle` / the spawn loop.

Measured by the 2026-08-07 backlog triage sweep. Of 19 blocked stories, **8
were held by a PR that had already merged** — every one of the ten PRs named
across the blocked set (6029, 6031, 6098, 6128, 6130, 6144, 6146, 6149, 6153
and 6160) was merged at sweep time. All eight survived the substantive
re-check and went straight to `ready`. Two more were half-stale, naming a code
fact that a merged PR had already changed:

- `check-pending-has-no-file-update-checker-watcher` claimed
  `Migration.checkPendingMigrations` "is still a no-op stub"; it was
  implemented at `migration.ts:1542-1548` by #6168.
- `internal-metadata-takes-a-pool-nullpool-arm-reads-enabled` claimed
  `AbstractAdapter#pool` is declared `pool: unknown`; #6128 typed it
  (`abstract-adapter.ts:866`).

So a majority of the blocked queue was stale, and the only thing that found it
was a human reading all nineteen. The oldest had been sitting since #6029
merged on 2026-08-03.

This is cheap to detect: the PR number is already written in the text, and
`gh pr view <N> --json state,mergedAt` answers in one call.

## Converged shape

A check that extracts `#\d+` references from every `blocked` story's
`blocked-by`, queries their state once (batched — `gh pr list --state merged
--json number` over a window, or one `gh api graphql` call, not N calls), and
reports each blocked story whose every named PR has merged.

**Report, do not auto-unblock.** The sweep's whole point is that a merged
blocker is necessary but not sufficient: each of the eight still needed its
premise re-verified against `origin/main` before it was safe to ready, and two
stories had a merged PR _and_ a live blocker. The output is a worklist for a
human or a triage agent, not a status mutation.

Where it runs is part of the story. Options, cheapest first: a `pnpm tasks
stale-blockers` subcommand run on demand; the same as a scheduled job that
opens or updates a single tracking issue; a warning line appended to `pnpm
tasks status`. It must NOT be a hard gate on the tasks repo's CI — network
access to the GitHub API from a validation run is a new dependency and a merged
PR is not by itself an error.

## Acceptance criteria

- [ ] A command reports every `blocked` story whose `blocked-by` names only
      already-merged PRs, printing story id, the PR numbers, and their merge
      dates.
- [ ] Stories whose `blocked-by` names no PR, or names at least one still-open
      PR, are not reported.
- [ ] PR state is fetched in O(1) API calls for the whole backlog, not one per
      story.
- [ ] Nothing mutates story status — output only.
- [ ] A test covers the extraction against the real `blocked-by` prose shapes,
      including a body naming two PRs where only one has merged (must not
      report) and one naming a PR inside a longer sentence (must report).
- [ ] Offline / no-`gh` behaviour is graceful: skip with a notice, do not fail.
