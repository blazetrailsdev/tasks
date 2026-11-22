---
title: "Trailties Tests (1) failing on main @cf2f4434"
status: in-progress
updated: 2026-11-22
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 0
pr: trails#10537
claim: "2026-11-22T00:46:30Z"
assignee: "red-cf2f4434"
blocked-by: null
closed-reason: null
---

## Context

CI is red on `main` of `blazetrailsdev/trails`. This story exists to get it green again.

### The failure

- Repo: `blazetrailsdev/trails`
- Branch: `main`
- Failing commit: `cf2f443495a22cbb4ed0697fb3544cc4e0881f92`
- Red since: 2026-11-21T23:02:37Z
- Failing checks:
  - `Trailties Tests (1)` — <https://github.com/blazetrailsdev/trails/actions/runs/44957904168/job/137010077379>
- Latest run: <https://github.com/blazetrailsdev/trails/actions/runs/44957904168/job/137010077379>

### Start by reading the actual logs

Don't guess at the cause from the check names. Pull the failing
output first:

```bash
gh run list --repo blazetrailsdev/trails --branch main --limit 10
gh run view <run-id> --repo blazetrailsdev/trails --log-failed
git log -1 cf2f443495a22cbb4ed0697fb3544cc4e0881f92        # what landed
git show cf2f443495a22cbb4ed0697fb3544cc4e0881f92 --stat   # and what it touched
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
- A flake is a code break. A test that fails on a timing race, a
  boundary, ordering or load is a bug in the test or the code: fix it so
  it cannot fail that way, and ship it as a PR. "Passes locally" and
  "unchanged test" are not resolutions, and filing a story instead of
  fixing it is not done.
- Only if the red is pure infrastructure (runner died, apt/registry
  outage, expired credential, GitHub outage) AND a rerun of the failed
  jobs comes back green, resolve it with the `ci-resolved` skill so the
  spawn loop un-pauses, and record what you found. Never stop while the
  red is unexplained.

## Verification

- Green run on the PR for each failing check above, then a green run on
  `main` after merge.
