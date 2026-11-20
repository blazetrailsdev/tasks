---
title: "ringo: record external PR activity and emit external_pr.* events"
status: claimed
updated: 2026-11-20
rfc: "0253-external-contributor-prs"
cluster: trust-gate
packages: []
deps: [ringo-classify-pr-trust-closed-by-default]
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-11-20T18:54:13Z"
assignee: "ringo-emits-external-issue-events"
blocked-by: null
closed-reason: null
---

## Context

Once the trust gate is in, external PR events stop at the gate. trailmap
still needs to see them.

## Acceptance criteria

- `opened`, `synchronize`, `reopened`, `closed`, issue comments and reviews
  on an external PR emit `external_pr.<action>` on `/events` with
  `{repo, pr, author, headSha, action}`.
- `GET /api/external-prs` lists open external PRs with their last activity.
- No GitHub write happens. A test asserts this.
