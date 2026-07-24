---
title: "claim: clear stale blocked-by once all deps are done"
status: draft
updated: 2026-07-24
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Hit while claiming `remove-pg-mysql-test-retry-after-flake-burndown` (PR #5244).
Both of its `deps` (`fix-hot-compatibilities-pg-cached-plan-flake` → #5228,
`fix-transaction-isolation-id-reflection-race` → #5230) were `status: done`, but
the story still carried `status: blocked` plus a `blocked-by` string written when
the deps were filed. `pnpm tasks claim` then failed the commit-time validator:

```text
blocked-by is set but status is "claimed" — only blocked stories carry blocked-by
```

`claim` flips status to `claimed` without clearing `blocked-by`, so the validator
it runs against its own output rejects it. The story is unclaimable until someone
manually runs `pnpm tasks status-set <id> ready` first, which is non-obvious — the
error names a state the caller never asked for.

`deps` reaching `done` is what unblocks a story, but nothing propagates that to the
`status`/`blocked-by` fields, so every dep-gated story hits this once its deps land.
See `scripts/tasks/cli.ts` (`flip` / `claim`) for where the transition happens.

## Acceptance criteria

- `claim` on a `blocked` story whose `deps` are all `done` succeeds, clearing
  `blocked-by` as part of the transition rather than erroring.
- `claim` on a story with a still-open dep continues to fail, and the error names
  the blocking dep(s).
- Consider having `ready` / `next-bundle` surface dep-satisfied `blocked` stories
  so they get scheduled instead of sitting invisible.
