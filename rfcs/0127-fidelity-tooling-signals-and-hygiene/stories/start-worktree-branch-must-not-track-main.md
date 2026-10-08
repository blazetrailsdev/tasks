---
title: "start-worktree.sh branch must not track refs/heads/main"
status: draft
updated: 2026-10-08
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

A branch created by `scripts/start-worktree.sh` ends up with
`branch.<name>.merge = refs/heads/main` while the repo sets
`push.default = upstream`, so a bare `git push` (or any push that lets git pick
the destination) computes `<branch> -> main`. The script's own closing line
(`scripts/start-worktree.sh:324`, "tracking nothing yet — push with:
git push -u origin $NAME") says the branch tracks nothing, which is not what
`git config branch.<name>.merge` reports in a fresh worktree (verified
2026-10-08 on the trails#8691 worktree before its first push). Only branch
protection stands between that and a push to trunk, and the memory
`project_worktree_push_default_upstream_targets_main` exists because it bit
once already.

## Acceptance criteria

- A worktree branch created by `start-worktree.sh` has no upstream, or an
  upstream of `origin/<branch>`, never `refs/heads/main`; verify with
  `git rev-parse --abbrev-ref @{push}` after `start-worktree.sh`, which must
  not answer `origin/main`.
- The closing hint in the script matches the real config.
- The script's test (if one exists) or a note in `vendor/README.md` /
  CONTRIBUTING.md records the expected upstream.
