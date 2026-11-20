---
title: "trailmap: inbox of external PRs on the pulls tab"
status: draft
updated: 2026-11-19
rfc: "0000-external-contributor-prs"
cluster: external-review
packages: []
deps: [ringo-emits-external-pr-events]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
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
