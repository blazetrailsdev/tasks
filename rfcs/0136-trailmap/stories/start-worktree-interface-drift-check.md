---
title: "Nothing catches trailmap's start-worktree.sh drifting from the trails interface ringo calls"
status: draft
updated: 2026-11-25
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

ringo invokes trailmap's and trails' `scripts/start-worktree.sh` with one
interface (the comment at trailmap `scripts/start-worktree.sh:10-14` says so),
but nothing checks that trailmap's copy keeps that interface. It drifted: trails
gained `--branch <existing-branch> [<name>]` (trails `scripts/start-worktree.sh:22-48`)
and trailmap's never did, so the dashboard's respawn button failed with `usage:`
on every trailmap PR until trailmap#202.

Expected shape: a check that fails when the two scripts' accepted invocations
diverge — e.g. a test that runs the same argument table (`<name>`,
`--branch <b>`, `--branch <b> <name>`, the invalid forms) against both copies
in a sandbox and compares exit codes and the derived target path.

## Acceptance

- CI fails if trailmap's start-worktree.sh rejects an invocation trails' accepts,
  or derives a different `$WORKTREES_ROOT/<name>` for it.
- Surfaced by trailmap#202.
