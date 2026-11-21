---
title: "ringo: draft a story from an external issue with a credential-less agent"
status: draft
updated: 2026-11-21
rfc: "0253-external-contributor-prs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap's "Promote to story" (story `trailmap-promote-external-issue-to-story`)
needs an agent to draft a story's title, Context and Acceptance criteria from an
external issue. ringo has nothing to call for that. Its external surface
(btwebooks `main.go:366-369`) is `GET /api/external-issues` (the list,
`webhook/external.go:181,197`), `POST /external-review/start` and
`GET /api/external-reviews`. All of that is PR review only
(`webhook/externalreview.go`).

## Acceptance criteria

- `POST /external-issue/draft-story` with `{repo, issue}` spawns a
  credential-less agent (no GitHub write token, as `externalreview.go` spawns
  its review agent). The agent gets the issue body and comments quoted as
  untrusted data, and writes `{title, context, acceptanceCriteria}`.
- ringo emits `external_issue.story_drafted`, and
  `GET /api/external-issue-drafts?repo=&issue=` returns the stored draft.
- Nothing writes to the tasks repo. The owner creates the story from trailmap.
- A test asserts that the spawned command carries no write token and that the
  prompt fences the issue text as data.
