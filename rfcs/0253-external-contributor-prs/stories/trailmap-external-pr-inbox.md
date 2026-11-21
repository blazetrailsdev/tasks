---
title: "trailmap: inbox of external PRs on the pulls tab"
status: in-progress
updated: 2026-11-21
rfc: "0253-external-contributor-prs"
cluster: external-review
packages: []
deps: [ringo-emits-external-pr-events]
deps-rfc: []
est-loc: 200
priority: null
pr: trailmap#189
claim: "2026-11-21T17:37:31Z"
assignee: "trailmap-external-pr-inbox"
blocked-by: null
closed-reason: null
---

## Context

`repo-pulls-controller.ts` lists PRs with their linked stories, and does not
mark who wrote them.

## Acceptance criteria

- The pulls index shows an **External** section (or badge), fed from
  `GET /api/external-prs` and kept live by `external_pr.*` events.
- Each row shows the author, the age, the last activity, the review state
  (`none`, `drafting`, `draft ready`, `sent`, `stale`) and a **Draft review**
  button with an optional focus note.
- Bumps the vendored ringo pin if this is the first story that needs the new
  endpoints.
