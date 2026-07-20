---
title: "/link fails to mark story in-progress on suffixed worktree branches"
status: draft
updated: 2026-07-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Hit while shipping #4999 (story
`arel-valueslist-row-casts-assert-node-on-raw-values`).

The `/link` skill marks a story in-progress with
`pnpm tasks in-progress "$(git branch --show-current)" --pr "$PR"`. Loop
workers get a worktree branch with a random suffix appended to the story id
(here `arel-valueslist-row-casts-assert-node-on-raw-values-f970`), so the
lookup fails:

```text
error: story "arel-valueslist-row-casts-assert-node-on-raw-values-f970" not found in index
```

The skill deliberately swallows this (`|| echo "note: ... skipped"`) so a
non-story branch never blocks the link. That is right for manually-linked
PRs, but it also makes the loop-worker case fail silently: the pane links
fine, CI/review webhooks arrive, and the story just stays looking unclaimed
until someone notices. I only caught it because the command printed the
error before the `||` branch ran.

Skill: `~/.claude/skills/link/SKILL.md`.

## Acceptance criteria

- [ ] `/link` resolves the story id from a suffixed worktree branch (strip a
      trailing `-[0-9a-f]{4}`, or fall back to the `Closes-story:` trailer in
      the PR body, which is already the canonical link).
- [ ] A branch that is genuinely not a story still skips silently — no
      regression in the manual-PR path.
- [ ] The skipped-vs-failed cases are distinguishable in the printed note, so
      a real lookup failure is not mistaken for "not a tracked story".
