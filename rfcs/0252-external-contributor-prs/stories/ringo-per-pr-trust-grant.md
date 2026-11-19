---
title: "ringo + trailmap: owner promotes a single external PR to trusted"
status: draft
updated: 2026-11-19
rfc: "0252-external-contributor-prs"
cluster: trust-gate
packages: []
deps: [ringo-classify-pr-trust-closed-by-default, trailmap-external-pr-inbox]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
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
