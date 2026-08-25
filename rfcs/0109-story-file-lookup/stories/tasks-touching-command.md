---
title: "Add pnpm tasks touching <path>"
status: done
updated: 2026-08-18
rfc: "0109-story-file-lookup"
cluster: file-lookup
packages: []
deps:
  - index-story-paths
deps-rfc: []
est-loc: 90
priority: 1
pr: 69
claim: "2026-08-18T14:50:47Z"
assignee: "tasks-touching-command"
blocked-by: null
---

## Context

With `story_paths` in the index (`index-story-paths`), add the verb that answers
the two questions this RFC exists for: **is this file already triaged?** and
**will it get touched anyway?**

`pnpm tasks` has no path query today — and no `search` command at all
(`scripts/cli.ts:3450-3714` has no such case; `usage()` at `:3717` has no such
line). The new verb sits next to `list` (`scripts/cli.ts:3489`) and follows the
same shape: a pure query function unit-tested against a synthetic index, plus
thin dispatch.

**The trails checkout must be resolved from `process.cwd()`, never from
`TASKS_DIR`.** The per-worktree `tasks` symlink (`scripts/cli.ts:76-93`, arm 3)
resolves to `…/blazetrailsdev/tasks-worktrees/<name>` — a _sibling_ tree, not a
child of the trails worktree — so `dirname(TASKS_DIR)` is not the trails repo.
`pnpm tasks` is invoked from inside a trails worktree via
`scripts/tasks/tasks.sh`, so cwd is the reliable anchor.

Churn is cheap enough to compute per query: a path-scoped
`git log --oneline --since=90.days -- <path>` measures 0.24–0.27s on real trails
history for both a file and a directory prefix. No cache, nothing to invalidate.

## Acceptance criteria

- [ ] `storiesTouching(index, query, opts)` exported from `scripts/cli.ts` near
      `listFiltered()` (`:609`), matching in order: exact path, directory
      prefix, then substring.
- [ ] Open statuses (`draft`, `ready`, `claimed`, `in-progress`, `blocked`) are
      included by default; `--all` additionally includes `done`/`closed`.
      Drafts must be included — 806 of 1,198 open stories are drafts, and a
      draft story is triage.
- [ ] Stories from an older index with no `story_paths` are skipped, not
      crashed on.
- [ ] `resolveTrailsRepo(cwd, flag)` resolves `--repo` → `$TRAILS_DIR` → nearest
      enclosing checkout above cwd having both `.git` and `packages/` → `null`.
- [ ] `churnVerdict(commits90d)`: `>=12` → `hot`, `2..11` → `moderate`, `<2` →
      `cold`.
- [ ] When the trails repo cannot be resolved, the churn column is omitted with
      one note and the command still succeeds.
- [ ] Dispatch case added using `readIndexSource().index`; `"repo"` added to the
      `valueFlags` array (`:3425-3444`); a `touching` entry added to `usage()`.
- [ ] `--json` emits `{ query, path_churn_90d, churn_verdict, trails_repo,
stories }`; human output reuses `formatRows()` (`:3278`) under a churn
      banner.
- [ ] With no matching stories, output states that plus the churn line — the
      "cold and unclaimed" combination is the answer that means _file it now_.

## Definition of done

A warning at claim time does not close this story, and neither does any gate:
collision warning was back-tested at 21% recall and is an explicit non-goal.
This is a read-only query.

## Verification

```bash
pnpm tasks touching packages/activerecord/src/relation.ts
# expect ~46 open stories across 7 RFCs, churn verdict: hot

pnpm tasks touching packages/activerecord/src/associations/ --json | head -20
# directory-prefix match resolves

pnpm test
```

## Notes

`scripts/cli.test.ts` should assert explicitly that a `tasks` symlink's parent
is not mistaken for the trails repo — that is the bug most likely to be
reintroduced, and it fails silently (churn simply reads as zero) rather than
loudly.

**Citations are line-accurate as of tasks `def67d896`.** Anchor on the symbol
names — `listFiltered()`, `formatRows()`, `valueFlags`, `usage()`, `case
"list"`, `resolveTasksDir()` — rather than the line numbers. This RFC's own
first draft was authored against a tree 319 commits behind main and every number
in it had drifted; the same will happen here before the story is claimed.
