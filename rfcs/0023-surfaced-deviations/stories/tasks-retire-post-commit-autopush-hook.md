---
title: "tasks repo: retire/foreground the post-commit background auto-push; simplify vestigial landed-race check"
status: draft
updated: 2026-07-08
rfc: "0023-surfaced-deviations"
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

Since PR #4778 the trails CLI commits with `RFCS_NO_AUTOPUSH=1`
(`scripts/tasks/cli.ts` commitAndPush) and owns its push, so the tasks
repo's `.husky/post-commit` background auto-push now only fires for
hand-made commits. Two follow-ups:

1. Evaluate retiring the background auto-push hook in the **tasks repo**
   (`.husky/post-commit`): its detached `git push … &` races whatever else
   is happening in the checkout, produces the confusing
   "rfcs auto-push failed: … cannot lock ref" noise, and its only remaining
   beneficiary is a human committing by hand (who can push). If kept,
   consider foregrounding it so failures surface synchronously.
2. Once the hook is retired (or for CLI commits generally), the
   landed-race confirm-check in commitAndPush (`scripts/tasks/cli.ts`,
   the rev-parse HEAD vs fetched origin/main comparison inside the push
   catch) exists specifically to detect the hook's push winning the race;
   it becomes vestigial for CLI-originated commits and can be simplified —
   only after confirming no other writer can land our exact HEAD first.

## Acceptance criteria

- Decision recorded (retire / foreground / keep) with the hook change
  landed in the tasks repo if retiring.
- If retired: the commitAndPush landed-race branch is simplified and its
  tests updated; if kept: a comment documents why.
