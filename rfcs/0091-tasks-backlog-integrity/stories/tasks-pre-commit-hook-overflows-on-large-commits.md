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

**Correction (2026-09-09): this story's diagnosis does not hold up, though its
requirement does.** Three of its factual claims were checked against both repos:

- **"The tasks repo's pre-commit hook (`.husky/pre-commit`)" never existed.**
  `.husky` has no history in this repo (`git log --all -- .husky` is empty) and
  `core.hooksPath` was unset, so no hook ran here at any point before tasks #73.
- **The commit range `407d64cde..6583e818b` resolves in neither repo** today —
  not in `blazetrailsdev/tasks`, not in `blazetrailsdev/trails`.
- **PR #6347 is a trails PR**, "feat(parity): AR closure rollup; test:stubs
  read-only by default" (merged 2026-08-10) — not a sweep of this repo's story
  bodies.

So the incident cannot be reconstructed from what is written here, and this
story should not be read as evidence about any specific hook. The `sh` snippet
below is retained as an illustration of the shape to avoid, not as a quotation
of code that ran in this repo.

The failure mode it warns about is real and reachable regardless of that
provenance: sweeps across thousands of story bodies genuinely happen here, and a
hook that passes the whole staged list as one argv dies on `E2BIG` — under
`set -e`, before printing anything, which reads from the caller as a validation
failure and invites `--no-verify`, the one thing a hook exists to prevent.

```sh
# The shape to avoid — unbounded argv:
STAGED_MD=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.md$' || true)
npx --no-install prettier --write $STAGED_MD
```

## Converged shape

The invariant, not a particular implementation:

- **Argv must be bounded**, so both the formatter and the linter batch rather
  than overflow on an arbitrarily large staged set. `xargs` (NUL-delimited via
  `git diff --cached -z --name-only`) is one way; a runner that batches
  internally is another, and is what this repo selected.
- **Any failure must print WHY before exiting non-zero.** A silent non-zero exit
  from a commit hook is the worst possible signal.

**Selected implementation: `lint-staged`, via the pre-commit gate in tasks #73**,
which batches argv itself — so the `xargs` plumbing above is superseded here, not
merely unimplemented. A future implementer should change lint-staged's
configuration rather than reintroduce a hand-rolled staged-file loop.

## Acceptance criteria

- [ ] A commit staging 2000+ markdown files runs the hook to completion.
- [ ] Any hook failure prints an actionable message before exiting non-zero.

Both are met by the gate in tasks #73. Measured there: a commit staging 2500
markdown files ran to completion in 3.3s, and the hook fails closed with a named
remedy when `lint-staged` is absent. Left open until that PR merges.
