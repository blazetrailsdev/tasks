---
title: "tasks CLI: make index build + auto-push safe against a dirty/divergent worktree"
status: claimed
updated: 2026-06-12
rfc: "0001-task-system"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 12
pr: null
claim: "2026-06-12T16:54:56Z"
assignee: "cli-dirty-worktree-safe-index-build"
blocked-by: null
---

## Context

The highest-impact DX footgun observed this session. Mutating commands rebuild
`index.json` by **git-stashing** the working tree, building from the committed
state, then popping the stash. Two concrete failures resulted:

1. **Uncommitted edits get clobbered / conflict-marked.** Editing a story file
   and then running a mutating command (e.g. `priority`) stashed the edits, built
   from the older committed content, and on stash-pop produced literal git
   conflict markers (`<<<<<<<` / `=======` / `>>>>>>>`) **inside the story
   frontmatter** — corrupting the file and the index's view of it.
2. **Auto-push dies on divergence.** The post-mutation auto-push failed with
   `! [rejected] main -> main (non-fast-forward)` when the remote was ahead,
   leaving the repo mid-`rebase`/detached-HEAD with conflicts to resolve by hand.

Fix the build/push path to be robust:

- Build the index from the **working tree** (or refuse to run with a dirty tree
  and tell the user to commit first) instead of stash-pop around a
  committed-state build. No path should ever write conflict markers into a story
  file.
- Before auto-push, `git pull --rebase` (or fetch + fast-forward check) and
  surface a clear, recoverable message on conflict rather than leaving a detached
  HEAD.

## Acceptance criteria

- [ ] Running a mutating command with uncommitted story edits never injects git
      conflict markers or discards the edits
- [ ] Index reflects the working-tree content the user just edited (or the
      command refuses with a clear "commit first" message)
- [ ] Auto-push reconciles with a divergent remote (rebase/fast-forward) and, on
      conflict, leaves the repo in a clearly-messaged recoverable state — never a
      silent detached HEAD
- [ ] Behavior covered by a test or documented manual repro
