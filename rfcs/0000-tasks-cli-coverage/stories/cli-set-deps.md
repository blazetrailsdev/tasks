---
title: "tasks set-deps / set-deps-rfc — edit story dependency arrays"
status: draft
updated: 2026-06-11
rfc: "0000-tasks-cli-coverage"
cluster: story-fields
deps: [frontmatter-block-editor]
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

A story's `deps` and `deps-rfc` arrays can only be set by hand-editing the file
(or via `refine` from a worktree). This story adds direct commands built on the
array-safe setter, with the same reference + cycle checks the validator already
enforces.

## Acceptance criteria

- [ ] `tasks set-deps <id> <csv>` and `tasks set-deps-rfc <id> <csv>` replace the
      respective array via the [[frontmatter-block-editor]] setter.
- [ ] Each referenced story (`deps`) / RFC (`deps-rfc`) must exist; a missing
      reference fails before any commit.
- [ ] Adding a dep that would create a cycle is rejected, reusing the validator's
      DFS cycle check rather than duplicating it.
- [ ] Empty csv clears the array to `[]`.
- [ ] Commits + pushes via `commitAndPush`, message `set-deps: <id>`; `updated`
      bumped.

## Notes

Depends on [[frontmatter-block-editor]]. Cycle/reference logic should share code
with [[validate-as-library]] if that has landed.
