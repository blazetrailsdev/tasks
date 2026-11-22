---
title: "ringo + trailmap: owner promotes a single external PR to trusted"
status: done
updated: 2026-11-22
rfc: "0253-external-contributor-prs"
cluster: trust-gate
packages: []
deps: [ringo-classify-pr-trust-closed-by-default, trailmap-external-pr-inbox]
deps-rfc: []
est-loc: 150
priority: null
pr: trailmap#190
claim: "2026-11-21T20:26:34Z"
assignee: "ringo-per-pr-trust-grant"
blocked-by: null
closed-reason: null
---

## Acceptance criteria

- `POST /api/pr-trust {repo, pr}` records `{grantedBy, grantedAt, author,
headRepo}`. `classifyPR` treats the PR as trusted while the author and the
  head repo still match.
- A push by a different login, or a change of head repo, revokes the grant
  and emits an event.
- trailmap's inbox row has a **Trust this PR** action with a confirm dialog.
