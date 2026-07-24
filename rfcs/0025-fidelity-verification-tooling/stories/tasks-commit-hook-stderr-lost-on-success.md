---
title: "tasks: pre-commit hook stderr is swallowed on successful mutations"
status: ready
updated: 2026-07-24
rfc: "0025-fidelity-verification-tooling"
cluster: null
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

PR 5270 (`tasks-new-surfaces-markdownlint-failure`) made `commitAndPush` pipe
`git commit`'s stderr via the new `captureStderr` option on `git()`
(`scripts/tasks/cli.ts:366-382`, call site `cli.ts:1066-1070`) so a
markdownlint rejection can be extracted and re-surfaced as the last thing
printed.

Side effect, called out in the merged PR description rather than hidden: on a
**successful** mutation the pre-commit hook's stderr chatter no longer prints.
That chatter is mostly noise (`Finding:`, `Linting:`, `Summary: 0 error(s)`),
which is why the trade-off was accepted, but it also carried the
`validated N RFCs and M stories.` progress line and would carry any
non-fatal hook warning. Those are now invisible on the success path.

Restoring them needs a different capture mechanism: `execFileSync` returns
stdout only, so stderr is unavailable on success. `spawnSync` exposes both,
but `git()` is `execFileSync`-based and `scripts/tasks/cli.test.ts` mocks
`node:child_process` wholesale with an `execFileSync` mock, so switching would
churn every mocked call site in that file. That churn is the reason it was not
done inline in 5270.

## Acceptance criteria

- [ ] A successful `tasks` mutation either re-emits the pre-commit hook's
      stderr or deliberately filters it to the lines worth keeping.
- [ ] The markdownlint failure surfacing from 5270 still holds: violations are
      the last thing printed, exit is non-zero, no partial commit remains.
- [ ] The existing `cli.test.ts` mocks are migrated coherently, not duplicated
      across two child-process entry points.
