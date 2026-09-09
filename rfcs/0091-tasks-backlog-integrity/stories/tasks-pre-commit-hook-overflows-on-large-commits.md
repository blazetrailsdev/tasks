---
title: "tasks pre-commit hook exits 1 silently on a large staged-markdown argv"
status: draft
updated: 2026-08-10
rfc: "0091-tasks-backlog-integrity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

**Correction (2026-09-09): the premise below is false as written — this repo has
never had a pre-commit hook.** `.husky` has no history here, `core.hooksPath` was
unset, and the argv-overflow trace this story describes came from the trails
repo's hook, not this one. What actually reached main unformatted did so because
nothing ran before a commit at all. The concern the story records is still the
right one to hold a new hook to, so the story is kept and its acceptance criteria
are unchanged; only the diagnosis is corrected.

The shape it warns about, for the hook that does not exist, is passing the full
staged markdown list to `prettier --write` and `markdownlint-cli2` as one argv:

```sh
STAGED_MD=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.md$' || true)
npx --no-install prettier --write $STAGED_MD
```

Committing the `sweep-legacy-script-spellings-in-the-tasks-repo` sweep (1917
changed story bodies, PR #6347) made `git commit` exit 1 with NO output at all:
the hook runs under `set -e`, and the oversized argv kills the step before
anything is printed. From the caller it is indistinguishable from a validation
failure, and the obvious next move — `--no-verify` — is exactly what the hook
exists to prevent. The sweep only landed because it was split into 13 chunked
commits of 150 files each (`blazetrailsdev/tasks` 407d64cde..6583e818b).

## Converged shape

- Feed the staged list through `xargs` (NUL-delimited via
  `git diff --cached -z --name-only`) so both `prettier` and `markdownlint-cli2`
  batch instead of overflowing.
- Whatever the failure mode, the hook must print WHY it failed before exiting —
  a silent non-zero exit from a commit hook is the worst possible signal.

## Acceptance criteria

- [ ] A commit staging 2000+ markdown files runs the hook to completion.
- [ ] Any hook failure prints an actionable message before exiting non-zero.

Both are addressed by the `lint-staged` pre-commit gate in tasks #73, which
batches argv itself rather than needing the `xargs` plumbing above, and fails
closed with a named remedy. Measured there: a commit staging 2500 markdown files
ran to completion in 3.3s. Leaving this open until that PR merges.
