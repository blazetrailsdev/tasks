---
title: "Lint failing on main @eb90cd3e"
status: in-progress
updated: 2026-10-30
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 0
pr: trails#9515
claim: "2026-10-30T23:44:22Z"
assignee: "red-eb90cd3e"
blocked-by: null
closed-reason: null
---

## Context

CI is red on `main` of `blazetrailsdev/trails`. This story exists to get it green again.

### The failure

- Repo: `blazetrailsdev/trails`
- Branch: `main`
- Failing commit: `eb90cd3e3db147057d71d62dd3c5625258728aa0`
- Red since: 2026-10-30T23:43:01Z
- Failing checks:
  - `Lint` — <https://github.com/blazetrailsdev/trails/actions/runs/41145446596/job/124369432869>
- Latest run: <https://github.com/blazetrailsdev/trails/actions/runs/41145446596/job/124369432869>

### Start by reading the actual logs

Don't guess at the cause from the check names. Pull the failing
output first:

```bash
gh run list --repo blazetrailsdev/trails --branch main --limit 10
gh run view <run-id> --repo blazetrailsdev/trails --log-failed
git log -1 eb90cd3e3db147057d71d62dd3c5625258728aa0        # what landed
git show eb90cd3e3db147057d71d62dd3c5625258728aa0 --stat   # and what it touched
```

Then reproduce the failure locally before you change anything, so you
can tell a real fix from a hopeful one.

## Acceptance criteria

- The root cause of the red is identified and stated in the PR body —
  not just "tests pass now".
- Every check listed above passes on the PR.
- No new skips, `.skip`/`xit`, `@ts-expect-error`, `eslint-disable`, or
  known-failure baseline entries are added to make a check pass. Silencing
  a check is not fixing it.
- Fix forward: the broken work is carried to completion. Do NOT revert
  the offending commit unless you have established that finishing it is
  genuinely not possible, and say so explicitly in the PR if you do.

## Definition of done

- Keep working until a build is actually green. A red build is not
  done, no matter how plausible the fix looks — push, wait for CI, read
  the result, and iterate. If the fix uncovers a second failure, fix that
  too; the job ends at green, not at "the original error is gone".
- This is priority 0: it blocks every other agent, because the spawn
  loop pauses while main is red. Don't pick up adjacent cleanup, don't
  refactor, don't widen scope. Smallest change that makes CI green and
  leaves the intended behavior intact.
- If the red turns out not to be a code break at all (flake,
  infrastructure, expired credential, upstream outage), don't invent a
  code change for it — resolve it with the `ci-resolved` skill so the
  spawn loop un-pauses, and record what you found.

## Verification

- Green run on the PR for each failing check above, then a green run on
  `main` after merge.
