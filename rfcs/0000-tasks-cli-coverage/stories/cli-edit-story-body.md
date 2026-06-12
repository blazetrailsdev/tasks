---
title: "tasks edit — open $EDITOR on a story body and commit the result"
status: draft
updated: 2026-06-11
rfc: "0000-tasks-cli-coverage"
cluster: story-fields
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`refine` already commits arbitrary edited story content (body + arrays) from a
worktree, and remains the path for agents doing large body edits. The one
remaining hand-edit case is a **human** wanting to tweak a story's Context /
Acceptance criteria without manually opening the file in the repo. This optional
story closes that gap with an editor-driven command.

## Acceptance criteria

- [ ] `tasks edit <id>` copies the story to a temp file, opens `$EDITOR`
      (fallback sensible default), and on save commits the new content via a
      `commitAndPush` mutator (same path `refine` uses to write full content).
- [ ] If the editor exits with no change, no commit is made (mirrors `refine`'s
      no-change short-circuit).
- [ ] Frontmatter edits made in the editor are preserved as-is; `updated` is
      bumped.
- [ ] Works on the canonical checkout without leaving uncommitted state (temp
      file + atomic mutator, never a dirty working tree).

## Notes

Lowest priority in this RFC — `refine` covers the agent workflow already. Listed
for completeness so "no hand-editing" is literally true for humans too.
