---
title: "Wire spawn-loop to trails-tasks next-bundle"
status: draft
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

Today the `spawn-loop` skill greps `- [ ]` lines from plan docs. After
`scaffold-tooling` lands, RFC-tracked work is queryable via
`pnpm tasks next-bundle --json`. This story updates the skill to prefer
that path, falling back to grep for any plan doc without a matching RFC.

See RFC 0001 §Workflow integration and §Rollout coexistence rule.

## Acceptance criteria

- [ ] `spawn-loop` skill calls `pnpm tasks next-bundle --max-loc 250 --json`
      first; uses the returned story's `file_path` for prompt context
- [ ] Skill calls `pnpm tasks claim <id> --assignee <worktree>` before
      launching the agent; retries `next-bundle` on claim failure
- [ ] Skill falls back to the existing grep path for plan docs not yet
      converted to RFCs
- [ ] Skill documentation updated to describe both paths

## Notes

Do not modify spawn-loop's stop/restart semantics — see
[[spawn-loop-stop-means-stop]] memory.
