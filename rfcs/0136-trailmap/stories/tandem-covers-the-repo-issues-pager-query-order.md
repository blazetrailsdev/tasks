---
title: "script/tandem compares the repo issues pager links between the two apps"
status: claimed
updated: 2026-11-01
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: "2026-11-01T14:56:30Z"
assignee: "attribute-rejects-a-name-that-shadows-base"
blocked-by: null
closed-reason: null
---

## Context

trailmap#102 moved the repo issues pager to `this.repoIssuesPath(..., { state, page })` (`app/controllers/repo-issues-controller.ts`) and its twin to `repo_issues_path` (`rails/app/controllers/repo_issues_controller.rb`). Rails sorts query keys, so it writes `page` before `state`. `script/tandem` was not run on that change, so the trails side's order is unverified.

## Acceptance criteria

- `script/tandem` compares a paged `/:owner/:repo/issues` response between the two apps.
- Any difference in the links is fixed, in trails if `to_query` ordering is the cause.
