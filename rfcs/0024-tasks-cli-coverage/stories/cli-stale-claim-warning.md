---
title: "tasks status: warn on stale claims with no PR"
status: done
updated: 2026-06-14
rfc: "0024-tasks-cli-coverage"
cluster: guardrails
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 3228
claim: "2026-06-14T01:00:35Z"
assignee: "cli-stale-claim-warning"
blocked-by: null
---

## Context

`claim` is an ISO timestamp but nothing ever reads its age. When an agent
dies after claiming (this has happened — a fan-out agent orphaned its
stories), the story sits `claimed` forever, invisible to `ready` and
`next-bundle`, until a human notices. Surface it: `tasks status` (and
`tasks list`) should flag claims older than a threshold that have produced
no PR.

Default threshold 48h, overridable via `--stale-hours N`. Warning only —
auto-releasing a claim is explicitly out of scope (an agent may legitimately
be mid-flight; releasing is a human/`refine` decision).

## Acceptance criteria

- [ ] `tasks status` prints a `stale claims` section listing every story
      with status `claimed` (no `pr`) whose `claim` timestamp is older than
      the threshold, with story id, assignee, and claim age in hours.
- [ ] Threshold defaults to 48h; `--stale-hours N` overrides; section is
      omitted when empty.
- [ ] `tasks list` marks stale rows (e.g. a `!` or `stale` suffix in the
      status column) using the same computation.
- [ ] Unit tests with fixed clock injection cover fresh, stale, and
      stale-but-has-PR (not flagged) cases.

## Notes

Trails-repo change only (`scripts/tasks/cli.ts`). `in-progress` stories are
exempt — they have a PR by definition. Read the threshold once so `status`
and `list` can't disagree.
