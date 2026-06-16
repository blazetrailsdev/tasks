---
title: "Finalize/rebase race leaves duplicate 0000-/NNNN- RFC dirs with orphaned stories"
status: ready
updated: 2026-06-16
rfc: "0024-tasks-cli-coverage"
cluster: guardrails
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

When a `0000-<slug>` RFC is finalized to its assigned number on main
(`auto-finalize: assign RFC number(s) on main`, renaming the dir
`0000-<slug>` → `NNNN-<slug>` and rewriting refs), a story added to the
`0000-<slug>` dir **before the author's checkout sees the finalize** is orphaned
on rebase: the rebase reintroduces the stale `0000-<slug>` dir (carrying the new
story) alongside the finalized `NNNN-<slug>` dir (carrying the README), leaving
**two dirs for one RFC** and a story stranded under the dead `0000-` prefix.

Observed this session:

1. `pnpm tasks new-rfc schema-cache-always-warm-convergence …` created
   `rfcs/0000-schema-cache-always-warm-convergence/` and pushed to main.
2. A concurrent/auto `finalize` renamed it to
   `rfcs/0031-schema-cache-always-warm-convergence/` on main.
3. My next mutation (adding story R1) was authored on a base that still had the
   `0000-` dir, committed there, then rebased onto a main that already had
   `0031-`. The rebase produced BOTH `0000-…/stories/r1-…md` and
   `0031-…/README.md` — `git ls-tree origin/main` showed two dirs for the one
   RFC. Recovery was manual: `git mv` the story into `0031-/stories/`, rewrite
   its `rfc:`/body refs `0000-` → `0031-`, delete the empty `0000-` dir, commit.

## Acceptance criteria

- [ ] The finalize/rebase path detects a `0000-<slug>` dir whose `<slug>` already
      exists as a finalized `NNNN-<slug>` and **migrates** any stories from the
      `0000-` dir into the `NNNN-` dir (rewriting `rfc:` frontmatter and body
      refs), then removes the empty `0000-` dir — or refuses the operation with a
      clear message — so main never ends up with two dirs for one RFC.
- [ ] A read/validate command flags (and `reconcile`/`build` repairs) any
      existing duplicate `0000-`/`NNNN-` pair for the same slug.
- [ ] A test reproduces the race: add a story to a `0000-` RFC, finalize it
      concurrently, rebase, and assert a single `NNNN-` dir containing the story
      with corrected refs.

## Notes

- Pairs with `cli-mutation-atomic-rollback-and-error-surfacing` (the partial-
  write/blocked-checkout bug whose recovery rebase triggered this duplicate dir).
- CLI-internal (scripts/tasks + finalize); no runtime package impact.
