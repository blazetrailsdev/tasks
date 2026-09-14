---
title: "Lint failing on main @ab7f08d2"
status: done
updated: 2026-09-14
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 0
pr: trails#7746
claim: "2026-09-14T01:58:04Z"
assignee: "red-ab7f08d2"
blocked-by: null
closed-reason: null
---

## Context

CI is red on `main` of `blazetrailsdev/trails`. This story exists to get it green again.

### The failure

- Repo: `blazetrailsdev/trails`
- Branch: `main`
- Failing commit: `ab7f08d2e3a7b3f910fb18e6ad3655598095faf9`
- Red since: 2026-09-14T01:57:29Z
- Failing checks:
  - `Lint` — <https://github.com/blazetrailsdev/trails/actions/runs/34796809442/job/103833263759>
- Latest run: <https://github.com/blazetrailsdev/trails/actions/runs/34796809442/job/103833263759>

### Start by reading the actual logs

Don't guess at the cause from the check names. Pull the failing
output first:

```bash
gh run list --repo blazetrailsdev/trails --branch main --limit 10
gh run view <run-id> --repo blazetrailsdev/trails --log-failed
git log -1 ab7f08d2e3a7b3f910fb18e6ad3655598095faf9        # what landed
git show ab7f08d2e3a7b3f910fb18e6ad3655598095faf9 --stat   # and what it touched
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
