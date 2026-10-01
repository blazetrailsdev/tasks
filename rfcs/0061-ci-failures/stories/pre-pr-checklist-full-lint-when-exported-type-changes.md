---
title: "Pre-PR checklist: run full-tree lint when a PR changes an exported type"
status: draft
updated: 2026-10-01
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Lint` was red on `main` for five consecutive merges (trails#8307 `26ed9b2d8b` through trails#8315
`39e1c5a8ac`), pausing the spawn loop until trails#8316 landed. That first PR typed
relation calculations by grouping, so an ungrouped `count()` returns
`Promise<number>`; that made 106 `as number` / `as Promise<number>` /
`as Map<unknown, number>` casts in 33 activerecord files redundant, and
`@typescript-eslint/no-unnecessary-type-assertion` reported each one.

The mechanism is the one `ci-lint-scope-misses-cross-file-type-driven-breaks`
(trails#6853) recorded: the per-PR Lint job lints only changed files
(`.github/workflows/ci.yml`, the `ESLint` step's `lint:files` arm), and a
type-aware rule reads declarations in other files. That story deliberately kept
the per-PR scope and added the full-tree lint on push to `main`, which worked as
designed here — it reported the red and spawned `red-7778dece-r9`. What it does
not do is stop the break landing: the signal arrives after merge, and every PR
merged behind it inherits the red.

The break is cheap to catch before the PR opens. `pnpm lint` over the tree
reproduced all 106 errors locally in one run, and all 106 were `--fix`able.
CLAUDE.md § "Before you open the PR" has no step for it: step 6 mentions
`pnpm lint --fix` only for `arel` / `activemodel` method order.

This is not a request to widen `LINT_ALL_RE` or lint the tree on every PR —
trails#6853 rejected that on runner cost, and that decision stands.

## Acceptance criteria

- [ ] CLAUDE.md § "Before you open the PR" gains a step: a PR that changes the
      declared type of an exported member (a narrowed return type, a removed
      union arm, a newly typed parameter) runs full-tree `pnpm lint --fix`
      locally and commits the casts it removes, because the per-PR Lint job
      cannot see files the PR did not touch.
- [ ] The step names `@typescript-eslint/no-unnecessary-type-assertion` as the
      rule that fires and cites trails#8307 / trails#8316 as the instance.
- [ ] The per-PR Lint job's changed-files scope is unchanged.
