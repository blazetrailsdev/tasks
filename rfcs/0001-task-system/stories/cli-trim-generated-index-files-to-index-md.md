---
title: "tasks CLI: trim GENERATED_INDEX_FILES to index.md (json now gitignored)"
status: ready
updated: 2026-06-11
rfc: "0001-task-system"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: 31
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up to the tasks-repo change that stopped committing the generated
`index.json` / `search.json` caches (they're gitignored and rebuilt on demand by
`loadIndex()`; only `index.md`, the human registry, stays tracked).

`trails/scripts/tasks/cli.ts` still lists all three in `GENERATED_INDEX_FILES`
(cli.ts:260), which drives `restoreGeneratedFiles()` (cli.ts:277) — it
`git checkout -- <file>` each one before pulling to keep the tree clean. Now that
`index.json` / `search.json` are untracked, `git checkout -- index.json` just
fails and is swallowed by the per-file try/catch: harmless, but a wasted git call
per mutation and a now-stale comment block (cli.ts:256–276) that still describes
the JSON as "tracked … re-staged on every commit."

Trim `GENERATED_INDEX_FILES` to `["index.md"]` and update the surrounding
comments to match the new reality (only `index.md` is tracked; the JSON can't
dirty the tree because git ignores it). This further simplifies the dirty-tree
dance that `cli-dirty-worktree-safe-index-build` targets — coordinate so the two
don't rewrite the same block twice.

This is a `trails`-repo change (the CLI lives there, with copies across many
worktrees); keep it to `scripts/tasks/cli.ts` (+ `cli.test.ts` if a test asserts
the list).

## Acceptance criteria

- [ ] `GENERATED_INDEX_FILES` is `["index.md"]`; `restoreGeneratedFiles` no longer
      attempts to restore the untracked JSON caches
- [ ] The cli.ts:256–276 comment block reflects that only `index.md` is tracked
      and the JSON are gitignored, rebuilt-on-demand caches
- [ ] `pnpm tasks` mutations + `ready`/`list`/`status` still work against a
      checkout with no committed `index.json` (loadIndex rebuilds it)
- [ ] Any `cli.test.ts` assertion on the file list updated
