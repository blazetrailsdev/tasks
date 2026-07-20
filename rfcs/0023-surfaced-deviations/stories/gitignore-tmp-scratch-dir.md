---
title: "Ignore tmp/ so scratch artifacts cannot be swept in by git add -A"
status: draft
updated: 2026-07-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 5
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`tmp/` is not covered by any ignore rule (`git check-ignore -v
tmp/screenshots/1_x.html` returns nothing) and `origin/main` tracks nothing
under it. During PR #4997 a stray `tmp/screenshots/1_x.html` produced by an
unrelated tool was swept into a commit by `git add -A` and had to be removed
in review.

Any agent using `git add -A` in a worktree that has run a screenshot or scratch
tool will hit the same thing.

## Acceptance criteria

- `tmp/` ignored in the repo `.gitignore` (scoped so no currently-tracked path
  becomes ignored — verify with `git ls-files tmp/` first, which is empty today).
