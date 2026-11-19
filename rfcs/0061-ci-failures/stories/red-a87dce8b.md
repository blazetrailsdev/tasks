---
title: "Action Pack Tests failing on main @a87dce8b"
status: closed
updated: 2026-11-19
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 0
pr: null
claim: "2026-11-19T01:19:38Z"
assignee: "red-a87dce8b"
blocked-by: null
closed-reason: "One-off flake: StaticEncodingTest 'serves gzip files with not modified' got 200 instead of 304 once; absent from the last 100 failed CI runs, passes locally 6/6, and the Action Pack Tests rerun on run 44435378692 passed (job 135305725680). Per operator, no diagnostic unless it recurs."
---

## Context

CI is red on `main` of `blazetrailsdev/trails`. This story exists to get it green again.

### The failure

- Repo: `blazetrailsdev/trails`
- Branch: `main`
- Failing commit: `a87dce8be241f440b6fef24e4037cc70335db4c6`
- Red since: 2026-11-19T01:18:54Z
- Failing checks:
  - `Action Pack Tests` — <https://github.com/blazetrailsdev/trails/actions/runs/44435378692/job/135263003548>
- Latest run: <https://github.com/blazetrailsdev/trails/actions/runs/44435378692/job/135263003548>

### Start by reading the actual logs

Don't guess at the cause from the check names. Pull the failing
output first:

```bash
gh run list --repo blazetrailsdev/trails --branch main --limit 10
gh run view <run-id> --repo blazetrailsdev/trails --log-failed
git log -1 a87dce8be241f440b6fef24e4037cc70335db4c6        # what landed
git show a87dce8be241f440b6fef24e4037cc70335db4c6 --stat   # and what it touched
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
