---
title: "Virtualized DX Type Tests failing on main @aba0d94b"
status: done
updated: 2026-10-11
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 0
pr: trails#8790
claim: "2026-10-11T18:41:46Z"
assignee: "red-aba0d94b"
blocked-by: null
closed-reason: null
---

## Context

CI is red on `main` of `blazetrailsdev/trails`. This story exists to get it green again.

### The failure

- Repo: `blazetrailsdev/trails`
- Branch: `main`
- Failing commit: `aba0d94b6d6ae1086948f31b68612847d6067d08`
- Red since: 2026-10-11T18:41:13Z
- Failing checks:
  - `Virtualized DX Type Tests` — <https://github.com/blazetrailsdev/trails/actions/runs/38164133769/job/114545050228>
- Latest run: <https://github.com/blazetrailsdev/trails/actions/runs/38164133769/job/114545050228>

### Start by reading the actual logs

Don't guess at the cause from the check names. Pull the failing
output first:

```bash
gh run list --repo blazetrailsdev/trails --branch main --limit 10
gh run view <run-id> --repo blazetrailsdev/trails --log-failed
git log -1 aba0d94b6d6ae1086948f31b68612847d6067d08        # what landed
git show aba0d94b6d6ae1086948f31b68612847d6067d08 --stat   # and what it touched
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
