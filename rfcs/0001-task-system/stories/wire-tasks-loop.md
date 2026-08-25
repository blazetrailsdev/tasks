---
title: "Wire tasks-loop to next-bundle"
status: done
updated: 2026-05-29
rfc: "0001-task-system"
cluster: scaffold
deps: ["scaffold-tooling"]
est-loc: 80
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The existing `spawn-loop` skill greps `- [ ]` lines from plan docs. After
`scaffold-tooling` lands, RFC-tracked work is queryable via
`pnpm tasks next-bundle --json`. Rather than modify the working
`spawn-loop`, this story introduces a **new `tasks-loop` skill** (a copy)
that prefers the index path, falling back to grep for any plan doc
without a matching RFC. The `tasks-loop` SKILL.md lives in this repo
under `tooling/tasks-loop/` as the source of record and is symlinked into
the trails repo's `.claude/skills/` for runtime discovery.

See RFC 0001 §Workflow integration and §Rollout coexistence rule.

## Acceptance criteria

- [x] `tasks-loop` skill calls `pnpm tasks next-bundle --max-loc 250 --json`
      first; uses the returned story's `file_path` for prompt context
- [x] Skill calls `pnpm tasks claim <id> --assignee <worktree>` before
      launching the agent; retries `next-bundle` on claim failure
- [x] Skill falls back to the existing grep path for plan docs not yet
      converted to RFCs
- [x] Skill documentation updated to describe both paths

## Notes

> **Deprecated / removed (2026-07-07).** The `tasks-loop` skill this story
> wired up is gone. It was a per-session tmux-pane spawn loop, superseded by
> the persistent `SpawnLoop` in the btwhooks server. `tooling/tasks-loop/`
> no longer exists in this repo; the SKILL.md source is archived for history
> in the btwebooks repo under `skills-archive/tasks-loop/`. This story is left
> as a record of the original wiring; the paths it references below are
> historical.

`tasks-loop` is a copy of `spawn-loop`; the original is left untouched.
Do not modify either loop's stop/restart semantics — see
[[spawn-loop-stop-means-stop]] memory.
