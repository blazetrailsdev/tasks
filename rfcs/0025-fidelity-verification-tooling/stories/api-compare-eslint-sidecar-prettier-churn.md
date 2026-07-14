---
title: "api:compare regenerates eslint/rails-*.json unformatted, dirtying every worktree"
status: draft
updated: 2026-07-14
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #4865. `pnpm api:compare` regenerates
`eslint/rails-callback-invocations.json` in a form that fails
`prettier --check`, so every run leaves a spurious dirty file in the worktree:

```console
$ API_COMPARE_FORCE=1 pnpm api:compare && git status --porcelain
 M eslint/rails-callback-invocations.json
$ npx prettier --check eslint/rails-callback-invocations.json
[warn] eslint/rails-callback-invocations.json
```

The content is identical — the diff is pure formatting (the generator emits
single-line arrays; prettier expands them). This hits every agent that runs
api:compare: the file must be manually `git checkout`-ed before committing, or
the reformatting noise rides along in an unrelated PR. I hit it twice in #4865
and reverted it both times.

The generator writes the other `eslint/rails-*.json` sidecars the same way
(`rails-deprecated-methods.json`, `rails-private-methods.json`,
`rails-file-structure-method-order.json`); only the callback-invocations file
currently drifts, but the same fix should cover all of them so a future content
change to any sidecar doesn't reintroduce the churn.

Writer lives in the api-compare script tree (`scripts/api-compare/`) — the
`Wrote .../eslint/rails-*.json` lines at the end of an api:compare run.

## Acceptance criteria

- `pnpm api:compare` on a clean tree leaves `git status` clean (no formatting-only
  modification to any `eslint/rails-*.json`).
- Fix at the writer — format the emitted JSON to match the repo's prettier config
  (e.g. run the output through prettier, or match its array/indent shape) rather
  than adding the files to `.prettierignore` or to a lint exclude, which would
  just hide the drift.
- All four `eslint/rails-*.json` sidecars covered.
- `npx prettier --check eslint/` passes immediately after an api:compare run.
