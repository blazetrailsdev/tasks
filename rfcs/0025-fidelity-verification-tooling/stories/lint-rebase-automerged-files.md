---
title: "Lint files auto-merged by a rebase (pre-commit hook never sees them)"
status: done
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 22
pr: 5431
claim: "2026-07-27T17:55:13Z"
assignee: "lint-rebase-automerged-files"
blocked-by: null
closed-reason: null
---

## Context

The husky pre-commit hook runs `lint-staged`, which lints only files staged for
that commit. A `git rebase` that auto-merges a file produces new working-tree
content that **no hook ever lints** — the rebase replays commits without
invoking pre-commit, and auto-merged files never enter a staged-for-commit
state. The first signal is CI.

This bit PR #5356 twice in one rebase, and neither defect existed in either
parent branch:

1. **Orphaned imports.** #5356 deleted `buildHasOne`/`buildBelongsTo` from
   `packages/activerecord/src/associations.ts`; sibling #5357 deleted
   `buildThroughAssociation`/`createThroughAssociation` from the same file.
   Each deletion alone left `getInheritanceColumn`/`findStiClass`/`stiEnabled`
   still in use. The merged result orphaned all three →
   `unused-imports/no-unused-imports`, caught only by the `Lint` CI job
   (run 30210878433).
2. **A duplicated guard.** #5355 fixed `HasOneAssociation#foreignKeyColumns` to
   consult the rich reflection; #5356 fixed the same bug at a slightly
   different offset. Git merged both without conflict, leaving two identical
   `_reflectOnAssociation(...)?.foreignKey` lookups in one function, the second
   unreachable. No lint rule and no test catches this — it was found by review.

Both are the same failure mode: the merged content is never linted locally, and
a green test suite does not detect dead or duplicated code. Running the full
`eslint .` by hand takes >2 min, so agents reasonably skip it and trust the
hook.

## Acceptance criteria

- A `post-rewrite` (and ideally `post-merge`) husky hook lints the files touched
  by a rebase/merge — i.e. `git diff --name-only <old>..<new>` filtered to
  lintable extensions, passed to `eslint`. Scoped to changed files so it stays
  fast; the full-repo run stays CI's job.
- The hook reports rather than blocks (a rebase is not a commit the user can
  amend in-flight), but its output must be impossible to miss.
- Verify against the #5356 reproduction: rebase a branch deleting
  `buildHasOne` onto a `main` that deleted `buildThroughAssociation`, and
  confirm the hook flags the three orphaned `inheritance.js` imports.
- Document the manual fallback in CONTRIBUTING.md: after any rebase that moves
  the base, re-run lint on changed files and `git diff origin/main -- <file>`
  each file you believe you changed.

## Out of scope

Detecting the duplicated-guard case (2) — that needs semantic analysis, not
lint. Noted here only as evidence of the same root cause.
