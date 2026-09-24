---
title: "post-merge-findings' Closes-story grep is unanchored and case-preserving, unlike closesStoryIds"
status: draft
updated: 2026-09-24
rfc: "0061-ci-failures"
cluster: null
packages: []
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

`.claude/skills/post-merge-findings/run.sh` (gitignored in trails; each worktree
symlinks `.claude/skills` to the main checkout) extracts the ids it marks done with
`grep -oiE 'Closes-story:[[:space:]]*[a-z0-9][a-z0-9-]*'`. That pattern is unanchored
and keeps the matched case. The PR-time gate's `closesStoryIds`
(`scripts/closing-story-references.ts`, `CLOSES_STORY`) is line-anchored
(`^[^\S\n]*closes-story:…$`, multiline) and lowercases.

So the two disagree:

- A body line `This PR closes-story: foo` closes `foo` in run.sh, but the gate
  never judges it. That is the same ungated-close hole trails#8041 closed for the
  branch-name fallback.
- `Closes-story: Some-Story` passes `Some-Story` to `pnpm tasks done`, which
  matches ids exactly.

The header comment in `closing-story-references.ts` ("the gate and the marker can
never disagree") is false while this holds.

## Acceptance criteria

- run.sh extracts exactly the ids `closesStoryIds` returns. Either anchor and
  lowercase the grep to `CLOSES_STORY`'s shape, or read the ids from a
  `check:closing-story-refs --ids` mode where that script exists.
- `scripts/closing-story-references.test.ts` covers the mid-line and mixed-case
  bodies against whichever shape run.sh uses.
